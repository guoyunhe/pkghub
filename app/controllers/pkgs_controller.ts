import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

import App from '#models/app'
import Pkg from '#models/pkg'
import PkgTransformer from '#transformers/pkg_transformer'

const pkgTypes = ['deb', 'rpm', 'appimage', 'flatpak', 'snap', 'tar.gz'] as const

export default class PkgsController {
  async index({ params, request, serialize }: HttpContext) {
    const page = this.positiveInteger(request.input('page'), 1)
    const perPage = Math.min(this.positiveInteger(request.input('perPage'), 12), 50)
    const pkgsQuery = Pkg.query().preload('app').orderBy('id', 'desc')

    if (params.app_id) {
      await App.findOrFail(params.app_id)
      pkgsQuery.where('appId', params.app_id)
    } else {
      const rawQuery = request.input('q')
      const keyword = typeof rawQuery === 'string' ? rawQuery.trim().toLocaleLowerCase() : ''
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
    }

    const paginator = await pkgsQuery.paginate(page, perPage)
    return serialize(PkgTransformer.paginate(paginator.all(), paginator.getMeta()))
  }

  async show({ params, serialize }: HttpContext) {
    const pkg = await Pkg.query().where('id', params.id).preload('app').firstOrFail()
    return serialize(PkgTransformer.transform(pkg))
  }

  async store({ request, response, serialize }: HttpContext) {
    const pkg = await Pkg.create(await this.attributes(request))
    await pkg.load('app')
    response.created()
    return serialize(PkgTransformer.transform(pkg))
  }

  async update({ params, request, serialize }: HttpContext) {
    const pkg = await Pkg.findOrFail(params.id)
    await pkg.merge(await this.attributes(request)).save()
    await pkg.load('app')
    return serialize(PkgTransformer.transform(pkg))
  }

  async destroy({ params, response }: HttpContext) {
    const pkg = await Pkg.findOrFail(params.id)
    await pkg.delete()
    return response.noContent()
  }

  private async attributes(request: HttpContext['request']) {
    const name = this.requiredString(request.input('name'), 'name')
    const type = this.requiredString(request.input('type'), 'type')
    if (!pkgTypes.includes(type as (typeof pkgTypes)[number])) {
      throw new Exception(`type must be one of ${pkgTypes.join(', ')}`, { status: 422 })
    }

    const appId = this.requiredPositiveInteger(request.input('appId'))
    await App.findOrFail(appId)

    return {
      name,
      type,
      appId,
      version: this.optionalString(request.input('version')),
      release: this.optionalString(request.input('release')),
      arch: this.optionalString(request.input('arch')),
      downloadUrl: this.optionalString(request.input('downloadUrl')),
      checksum: this.optionalString(request.input('checksum')),
      checksumType: this.optionalString(request.input('checksumType')),
      installCommand: this.optionalString(request.input('installCommand')),
      size: this.optionalNumber(request.input('size')),
    }
  }

  private requiredString(value: unknown, field: string) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new Exception(`${field} is required`, { status: 422 })
    }
    return value.trim()
  }

  private optionalString(value: unknown) {
    if (value === undefined || value === null || value === '') return null
    if (typeof value !== 'string') throw new Exception('Value must be a string', { status: 422 })
    return value.trim() || null
  }

  private requiredPositiveInteger(value: unknown) {
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Exception('appId must be a positive integer', { status: 422 })
    }
    return parsed
  }

  private optionalNumber(value: unknown) {
    if (value === undefined || value === null || value === '') return null
    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new Exception('Value must be a non-negative number', { status: 422 })
    }
    return parsed
  }

  private positiveInteger(value: unknown, fallback: number) {
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
  }
}
