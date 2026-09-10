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

  private positiveInteger(value: unknown, fallback: number) {
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
  }
}
