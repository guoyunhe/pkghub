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
    // Health check
    router.get('/', () => ({ hello: 'world' }))

    // Auth
    router
      .group(() => {
        router.post('register', [controllers.Auth, 'register'])
        router.post('login', [controllers.Auth, 'login'])
        router.post('logout', [controllers.Auth, 'logout']).use(middleware.auth())
        router.get('user', [controllers.Auth, 'user']).use(middleware.auth())
      })
      .prefix('auth')

    // Users
    router.get('users/:id', [controllers.Users, 'show'])
    router.get('users/:id/favorites', [controllers.Users, 'favorites'])
    router.get('users/:id/reviews', [controllers.Reviews, 'userIndex'])

    // Apps
    router.get('apps', [controllers.Apps, 'index'])
    router.get('apps/:id', [controllers.Apps, 'show'])
    router
      .resource('apps', controllers.Apps)
      .only(['store', 'update', 'destroy'])
      .use('*', [middleware.auth(), middleware.admin()])
    router.post('apps/:id/favorite', [controllers.Favorites, 'store']).use(middleware.auth())
    router.delete('apps/:id/favorite', [controllers.Favorites, 'destroy']).use(middleware.auth())
    router.get('apps/:id/reviews', [controllers.Reviews, 'index'])
    router.post('apps/:id/reviews', [controllers.Reviews, 'store']).use(middleware.auth())
    router.delete('apps/:id/reviews', [controllers.Reviews, 'destroy']).use(middleware.auth())
    router.resource('apps.pkgs', controllers.Pkgs).only(['index'])

    // Images
    router.resource('images', controllers.Images).apiOnly().use('*', middleware.auth())

    // Packages
    router
      .resource('pkgs', controllers.Pkgs)
      .apiOnly()
      .use(['store', 'update', 'destroy'], [middleware.auth(), middleware.admin()])

    // Repos
    router.get('repos', [controllers.Repos, 'index'])
    router.get('repos/:id', [controllers.Repos, 'show'])
    router
      .resource('repos', controllers.Repos)
      .only(['store', 'update', 'destroy'])
      .use('*', [middleware.auth(), middleware.admin()])

    // Distros
    router.get('distros', [controllers.Distros, 'index'])
  })
  .prefix('/api')

router.on('*').render('app')
