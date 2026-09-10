import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

import App from '#models/app'
import AppTransformer from '#transformers/app_transformer'

type LocalizedText = Record<string, string>

export default class AppsController {
  async index({ request, serialize }: HttpContext) {
    const page = this.positiveInteger(request.input('page'), 1)
    const perPage = Math.min(this.positiveInteger(request.input('perPage'), 12), 50)
    const rawQuery = request.input('q')
    const query = typeof rawQuery === 'string' ? rawQuery.trim().toLocaleLowerCase() : ''
    const appsQuery = App.query().preload('icon').orderBy('id', 'desc')

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

  async show({ params, serialize }: HttpContext) {
    const app = await App.query().where('id', params.id).preload('icon').firstOrFail()
    return serialize(AppTransformer.transform(app))
  }

  async store({ request, response, serialize }: HttpContext) {
    const app = await App.create(this.attributes(request))
    await app.load('icon')
    response.created()
    return serialize(AppTransformer.transform(app))
  }

  async update({ params, request, serialize }: HttpContext) {
    const app = await App.findOrFail(params.id)
    await app.merge(this.attributes(request)).save()
    await app.load('icon')
    return serialize(AppTransformer.transform(app))
  }

  async destroy({ params, response }: HttpContext) {
    await (await App.findOrFail(params.id)).delete()
    return response.noContent()
  }

  private attributes(request: HttpContext['request']) {
    const name = this.localizedText(request.input('name'), 'name')
    const summary = this.localizedText(request.input('summary'), 'summary')
    return {
      name,
      summary,
      version: this.optionalString(request.input('version')),
      license: this.optionalString(request.input('license')),
      appstreamId: this.optionalString(request.input('appstreamId')),
      appstreamUrl: this.optionalString(request.input('appstreamUrl')),
      desktopUrl: this.optionalString(request.input('desktopUrl')),
    }
  }

  private localizedText(value: unknown, name: string): LocalizedText {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Exception(`${name} must be a localized text object`, { status: 422 })
    }
    const localized = Object.fromEntries(
      Object.entries(value).filter(
        ([locale, text]) => typeof text === 'string' && locale && text.trim(),
      ),
    )
    if (!localized.en) throw new Exception(`${name}.en is required`, { status: 422 })
    return localized
  }

  private optionalString(value: unknown) {
    if (value === undefined || value === null || value === '') return null
    if (typeof value !== 'string') throw new Exception('Value must be a string', { status: 422 })
    return value.trim() || null
  }

  private positiveInteger(value: unknown, fallback: number) {
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
  }
}
