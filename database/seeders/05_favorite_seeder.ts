import { BaseSeeder } from '@adonisjs/lucid/seeders'

import App from '#models/app'
import User from '#models/user'

const favoritesByUser = [
  {
    email: 'user@example.com',
    apps: ['com.libretro.RetroArch', 'org.keepassxc.KeePassXC.desktop'],
  },
  {
    email: 'admin@example.com',
    apps: ['dev.eden_emu.eden'],
  },
]

export default class FavoriteSeeder extends BaseSeeder {
  async run() {
    for (const { email, apps } of favoritesByUser) {
      const user = await User.findByOrFail('email', email)
      const favoriteApps = await App.query().whereIn('appstreamId', apps)

      const foundIds = new Set(favoriteApps.map((app) => app.appstreamId))
      const missing = apps.filter((appstreamId) => !foundIds.has(appstreamId))
      if (missing.length) {
        throw new Error(`Favorite seeder: apps not found for ${email}: ${missing.join(', ')}`)
      }

      await user.related('favoriteApps').sync(
        favoriteApps.map((app) => app.id),
        false,
      )
    }
  }
}
