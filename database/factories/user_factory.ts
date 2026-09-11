import factory from '@adonisjs/lucid/factories'

import User from '#models/user'

export const UserFactory = factory
  .define(User, async ({ faker }) => {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()

    return {
      name: faker.person.fullName({ firstName, lastName }),
      email: faker.internet.email({ firstName, lastName }),
      password: 'Password123!',
      role: 'user',
    }
  })
  .build()
