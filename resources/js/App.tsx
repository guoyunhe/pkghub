import { AppShell, Button, Container, Group, Loader, Menu, Text, Title } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { Redirect, Route, Switch, useLocation } from 'wouter'

import { AuthProvider, useAuth } from './auth'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function LanguageMenu() {
  const { i18n } = useTranslation()

  return (
    <Menu position='bottom-end' width={130}>
      <Menu.Target>
        <Button variant='subtle' color='dark' size='compact-sm'>
          {i18n.language.startsWith('zh') ? '中文' : 'EN'}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item onClick={() => i18n.changeLanguage('en')}>English</Menu.Item>
        <Menu.Item onClick={() => i18n.changeLanguage('zh')}>中文</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

function ProtectedPage() {
  const { t, i18n } = useTranslation()
  const { ready, user, logout } = useAuth()
  const [, navigate] = useLocation()

  if (!ready) {
    return (
      <div className='loading-screen'>
        <Loader color='orange' />
      </div>
    )
  }
  if (!user) return <Redirect to='/login' />

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const createdAt = user.createdAt
    ? new Intl.DateTimeFormat(i18n.language).format(new Date(user.createdAt))
    : '-'

  return (
    <AppShell header={{ height: 64 }} padding='md'>
      <AppShell.Header>
        <Container size='lg' className='header-content'>
          <Group justify='space-between' h='100%'>
            <Title order={3}>{t('appName')}</Title>
            <Group gap='xs'>
              <LanguageMenu />
              <Button variant='light' color='orange' onClick={handleLogout}>
                {t('logout')}
              </Button>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main>
        <Container size='lg' className='dashboard'>
          <Text className='eyebrow'>{user.name}</Text>
          <Title order={1}>{t('dashboardTitle')}</Title>
          <Text c='dimmed' size='lg'>
            {t('dashboardDescription')}
          </Text>
          <div className='account-summary'>
            <Text fw={600}>{user.name}</Text>
            <Text c='dimmed'>{user.email}</Text>
            <Text size='sm' c='dimmed'>
              {t('memberSince')} {createdAt}
            </Text>
          </div>
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}

function AppRoutes() {
  return (
    <Switch>
      <Route path='/login' component={LoginPage} />
      <Route path='/register' component={RegisterPage} />
      <Route path='/'>
        <ProtectedPage />
      </Route>
    </Switch>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
