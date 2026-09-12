import factory from '@adonisjs/lucid/factories'

import App from '#models/app'

export const AppFactory = factory
  .define(App, async () => {
    return {}
  })
  .build()
