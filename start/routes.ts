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
    router.get('packages', [controllers.Pkgs, 'search'])
    router.resource('apps.packages', controllers.Pkgs).only(['index'])
    router.get('repos', [controllers.Repos, 'index'])
    router.get('repos/:id', [controllers.Repos, 'show'])
    router
      .resource('repos', controllers.Repos)
      .only(['store', 'update', 'destroy'])
      .use('*', [middleware.auth(), middleware.admin()])
    router.get('distros', [controllers.Distros, 'index'])
    router
      .resource('apps', controllers.Apps)
      .only(['store', 'update', 'destroy'])
      .use('*', [middleware.auth(), middleware.admin()])
  })
  .prefix('/api')

router.on('*').render('app')
