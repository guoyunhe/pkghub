import { Route, Switch } from 'wouter'

import { AuthProvider } from './auth'
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

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
