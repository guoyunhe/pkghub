import { AppShell, Button, Group, Text } from '@mantine/core'
import { PlusIcon } from '@phosphor-icons/react/Plus'
import { SignInIcon } from '@phosphor-icons/react/SignIn'
import { SignOutIcon } from '@phosphor-icons/react/SignOut'
import { UserPlusIcon } from '@phosphor-icons/react/UserPlus'
import { Route, Switch } from 'wouter'
import { Link, useLocation } from 'wouter'

import { AuthProvider, useAuth } from './auth'
import AppDetailPage from './pages/AppDetailPage'
import AppFormPage from './pages/AppFormPage'
import AppsPage from './pages/AppsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function AppRoutes() {
  return (
    <Switch>
      <Route path='/login' component={LoginPage} />
      <Route path='/register' component={RegisterPage} />
      <Route path='/apps/new' component={AppFormPage} />
      <Route path='/apps/:id/edit' component={AppFormPage} />
      <Route path='/apps/:id' component={AppDetailPage} />
      <Route path='/apps' component={AppsPage} />
      <Route path='/'>
        <AppsPage />
      </Route>
    </Switch>
  )
}

function AppHeader() {
  const { ready, user, logout } = useAuth()
  const [, navigate] = useLocation()

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
        <Group gap='xs'>
          {ready && user ? (
            <>
              {user.role === 'admin' && (
                <Button
                  component={Link}
                  href='/apps/new'
                  leftSection={<PlusIcon size={18} weight='bold' />}
                  variant='light'
                >
                  Add application
                </Button>
              )}
              <Button
                leftSection={<SignOutIcon size={18} />}
                variant='default'
                onClick={() => void handleLogout()}
              >
                Sign out
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
                Sign in
              </Button>
              <Button component={Link} href='/register' leftSection={<UserPlusIcon size={18} />}>
                Create account
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
