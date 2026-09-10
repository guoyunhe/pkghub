import type { HttpContext } from '@adonisjs/core/http'

import App from '#models/app'
import Pkg from '#models/pkg'
import PkgTransformer from '#transformers/pkg_transformer'

export default class PkgsController {
  async index({ params, request, serialize }: HttpContext) {
    await App.findOrFail(params.app_id)
    const page = this.positiveInteger(request.input('page'), 1)
    const perPage = Math.min(this.positiveInteger(request.input('perPage'), 12), 50)
    const paginator = await Pkg.query()
      .where('appId', params.app_id)
      .orderBy('id', 'desc')
      .paginate(page, perPage)

    return serialize(PkgTransformer.paginate(paginator.all(), paginator.getMeta()))
  }

  async search({ request, serialize }: HttpContext) {
    const page = this.positiveInteger(request.input('page'), 1)
    const perPage = Math.min(this.positiveInteger(request.input('perPage'), 12), 50)
    const rawQuery = request.input('q')
    const keyword = typeof rawQuery === 'string' ? rawQuery.trim().toLocaleLowerCase() : ''
    const pkgsQuery = Pkg.query().preload('app').orderBy('id', 'desc')

    if (keyword) {
      const pattern = `%${keyword.replace(/[\\%_]/g, '\\$&')}%`
      pkgsQuery.where((subquery) => {
        subquery
          .whereILike('name', pattern)
          .orWhereILike('type', pattern)
          .orWhereILike('arch', pattern)
          .orWhereILike('version', pattern)
      })
    }

    const paginator = await pkgsQuery.paginate(page, perPage)
    return serialize(PkgTransformer.paginate(paginator.all(), paginator.getMeta()))
  }

  private positiveInteger(value: unknown, fallback: number) {
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
  }
}
