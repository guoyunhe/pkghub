import { AppShell, Button, Group, Select, Text, TextInput } from '@mantine/core'
import { GlobeIcon } from '@phosphor-icons/react/Globe'
import { HardDrivesIcon } from '@phosphor-icons/react/HardDrives'
import { MagnifyingGlassIcon } from '@phosphor-icons/react/MagnifyingGlass'
import { PlusIcon } from '@phosphor-icons/react/Plus'
import { SignInIcon } from '@phosphor-icons/react/SignIn'
import { SignOutIcon } from '@phosphor-icons/react/SignOut'
import { UserPlusIcon } from '@phosphor-icons/react/UserPlus'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Route, Switch } from 'wouter'
import { Link, useLocation, useSearchParams } from 'wouter'

import { AuthProvider, useAuth } from './auth'
import AppDetailPage from './pages/AppDetailPage'
import AppFormPage from './pages/AppFormPage'
import AppsPage from './pages/AppsPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import RepoFormPage from './pages/RepoFormPage'
import ReposPage from './pages/ReposPage'
import SearchResultsPage from './pages/SearchResultsPage'

function AppRoutes() {
  return (
    <Switch>
      <Route path='/login' component={LoginPage} />
      <Route path='/register' component={RegisterPage} />
      <Route path='/search' component={SearchResultsPage} />
      <Route path='/repos/new' component={RepoFormPage} />
      <Route path='/repos/:id/edit' component={RepoFormPage} />
      <Route path='/repos' component={ReposPage} />
      <Route path='/apps/new' component={AppFormPage} />
      <Route path='/apps/:id/edit' component={AppFormPage} />
      <Route path='/apps/:id' component={AppDetailPage} />
      <Route path='/apps' component={AppsPage} />
      <Route path='/'>
        <HomePage />
      </Route>
    </Switch>
  )
}

function AppHeader() {
  const { t, i18n } = useTranslation()
  const { ready, user, logout } = useAuth()
  const [, navigate] = useLocation()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const [searchQuery, setSearchQuery] = useState(query)
  const currentLanguage = i18n.language?.startsWith('zh') ? 'zh' : 'en'

  useEffect(() => {
    setSearchQuery(query)
  }, [query])

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <AppShell.Header className='app-header'>
      <div className='app-header__inner'>
        <Text component={Link} href='/' className='app-header__brand' fw={700}>
          <img src='/favicon.svg' alt='' className='app-header__icon' />
          PkgHub
        </Text>
        <form
          className='app-header__search-form'
          onSubmit={(event) => {
            event.preventDefault()
            const value = searchQuery.trim()
            navigate(value ? `/search?q=${encodeURIComponent(value)}` : '/apps')
          }}
        >
          <TextInput
            aria-label={t('header.searchApplications')}
            className='app-header__search'
            leftSection={<MagnifyingGlassIcon size={18} />}
            placeholder={t('header.searchApplications')}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
          />
        </form>
        <Group gap='xs'>
          <Select
            aria-label={t('language')}
            className='app-header__lang'
            allowDeselect={false}
            checkIconPosition='right'
            data={[
              { value: 'en', label: 'EN' },
              { value: 'zh', label: '中' },
            ]}
            leftSection={<GlobeIcon size={15} />}
            value={currentLanguage}
            variant='default'
            w={84}
            onChange={(language) => {
              if (language) void i18n.changeLanguage(language)
            }}
          />
          {ready && user ? (
            <>
              {user.role === 'admin' && (
                <>
                  <Button
                    component={Link}
                    href='/repos'
                    leftSection={<HardDrivesIcon size={18} />}
                    variant='default'
                  >
                    {t('header.repositories')}
                  </Button>
                  <Button
                    component={Link}
                    href='/apps/new'
                    leftSection={<PlusIcon size={18} weight='bold' />}
                    variant='light'
                  >
                    {t('header.addApplication')}
                  </Button>
                </>
              )}
              <Button
                leftSection={<SignOutIcon size={18} />}
                variant='default'
                onClick={() => void handleLogout()}
              >
                {t('logout')}
              </Button>
            </>
          ) : ready ? (
            <>
              <Button
                component={Link}
                href='/login'
                leftSection={<SignInIcon size={18} />}
                variant='default'
              >
                {t('login')}
              </Button>
              <Button component={Link} href='/register' leftSection={<UserPlusIcon size={18} />}>
                {t('register')}
              </Button>
            </>
          ) : null}
        </Group>
      </div>
    </AppShell.Header>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell header={{ height: 68 }}>
        <AppHeader />
        <AppShell.Main>
          <AppRoutes />
        </AppShell.Main>
      </AppShell>
    </AuthProvider>
  )
}
