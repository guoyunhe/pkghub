/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router';

import { controllers } from '#generated/controllers';
import { middleware } from '#start/kernel';

router
  .group(() => {
    // health check route
    router.get('/', () => ({ hello: 'world' }));

    router
      .group(() => {
        router.post('register', [controllers.Auth, 'register']);
        router.post('login', [controllers.Auth, 'login']);
        router.post('logout', [controllers.Auth, 'logout']).use(middleware.auth());
        router.get('user', [controllers.Auth, 'user']).use(middleware.auth());
      })
      .prefix('auth');
  })
  .prefix('/api');

router.on('*').render('app');
