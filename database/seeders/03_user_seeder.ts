import { BaseSeeder } from '@adonisjs/lucid/seeders'

import User from '#models/user'

const users = [
  {
    name: 'Test Admin',
    email: 'admin@example.com',
    password: 'Admin123!',
    role: 'admin',
  },
  {
    name: 'Test User',
    email: 'user@example.com',
    password: 'User123!',
    role: 'user',
  },
]

export default class UserSeeder extends BaseSeeder {
  async run() {
    for (const user of users) {
      await User.updateOrCreate({ email: user.email }, user)
    }
  }
}
