/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

import { controllers } from '#generated/controllers'
import { middleware } from '#start/kernel'

router
  .group(() => {
    // health check route
    router.get('/', () => ({ hello: 'world' }))

    router
      .group(() => {
        router.post('register', [controllers.Auth, 'register'])
        router.post('login', [controllers.Auth, 'login'])
        router.post('logout', [controllers.Auth, 'logout']).use(middleware.auth())
        router.get('user', [controllers.Auth, 'user']).use(middleware.auth())
      })
      .prefix('auth')

    router.resource('images', controllers.Images).apiOnly().use('*', middleware.auth())
    router.get('apps', [controllers.Apps, 'index'])
    router.get('apps/:id', [controllers.Apps, 'show'])
    router.get('apps/:id/packages', [controllers.Apps, 'packages'])
    router.get('distros', [controllers.Distros, 'index'])
    router
      .resource('apps', controllers.Apps)
      .only(['store', 'update', 'destroy'])
      .use('*', [middleware.auth(), middleware.admin()])
  })
  .prefix('/api')

router.on('*').render('app')
