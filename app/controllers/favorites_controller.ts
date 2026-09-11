import type { HttpContext } from '@adonisjs/core/http'

import App from '#models/app'

export default class FavoritesController {
  async store({ auth, params, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const app = await App.findOrFail(params.id)
    await user.related('favoriteApps').sync([app.id], false)
    response.created()
    return serialize({ favorited: true })
  }

  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const app = await App.findOrFail(params.id)
    await user.related('favoriteApps').detach([app.id])
    return response.noContent()
  }
}
