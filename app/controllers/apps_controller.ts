import type { HttpContext } from '@adonisjs/core/http'

import App from '#models/app'
import AppTransformer from '#transformers/app_transformer'
import { appValidator } from '#validators/app'

export default class AppsController {
  async index({ auth, request, serialize }: HttpContext) {
    const page = this.positiveInteger(request.input('page'), 1)
    const perPage = Math.min(this.positiveInteger(request.input('perPage'), 12), 50)
    const rawQuery = request.input('q')
    const query = typeof rawQuery === 'string' ? rawQuery.trim().toLocaleLowerCase() : ''
    const appsQuery = App.query()
      .preload('icon')
      .withAggregate('reviews', (subQuery) => subQuery.avg('rating').as('avgRating'))
      .orderBy('id', 'desc')

    if (auth.isAuthenticated) {
      appsQuery.preload('favoritedBy', (builder) => builder.where('users.id', auth.user!.id))
    }

    if (query) {
      const pattern = `%${query.replace(/[\\%_]/g, '\\$&')}%`
      appsQuery.where((searchQuery) => {
        searchQuery
          .whereILike('name', pattern)
          .orWhereILike('summary', pattern)
          .orWhereILike('version', pattern)
          .orWhereILike('license', pattern)
          .orWhereILike('appstreamId', pattern)
      })
    }

    const paginator = await appsQuery.paginate(page, perPage)
    return serialize(AppTransformer.paginate(paginator.all(), paginator.getMeta()))
  }

  async show({ auth, params, serialize }: HttpContext) {
    const appQuery = App.query()
      .where('id', params.id)
      .preload('icon')
      .withAggregate('reviews', (subQuery) => subQuery.avg('rating').as('avgRating'))
    if (auth.isAuthenticated) {
      appQuery.preload('favoritedBy', (builder) => builder.where('users.id', auth.user!.id))
    }
    const app = await appQuery.firstOrFail()
    return serialize(AppTransformer.transform(app))
  }

  async store({ request, response, serialize }: HttpContext) {
    const payload = await request.validateUsing(appValidator)

    const app = await App.create(payload)
    await app.load('icon')
    response.created()
    return serialize(AppTransformer.transform(app))
  }

  async update({ params, request, serialize }: HttpContext) {
    const app = await App.findOrFail(params.id)
    const payload = await request.validateUsing(appValidator, { meta: { appId: app.id } })

    await app.merge(payload).save()
    await app.load('icon')
    return serialize(AppTransformer.transform(app))
  }

  async destroy({ params, response }: HttpContext) {
    const app = await App.findOrFail(params.id)
    await app.delete()
    return response.noContent()
  }

  private positiveInteger(value: unknown, fallback: number) {
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
  }
}
