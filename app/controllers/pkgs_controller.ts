import { randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { unlink } from 'node:fs/promises'
import { basename } from 'node:path'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'

import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import drive from '@adonisjs/drive/services/main'

import App from '#models/app'
import Pkg from '#models/pkg'
import PackageFileExtractor from '#services/package_file_extractor'
import PkgTransformer from '#transformers/pkg_transformer'

const pkgTypes = ['deb', 'rpm', 'appimage', 'flatpak', 'snap', 'tar.gz'] as const

// Package files are uploaded outside of the global multipart limit (see config/bodyparser.ts)
// and streamed to the disk instead of being buffered in memory.
const maxPackageSize = 2 * 1024 * 1024 * 1024

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

  /**
   * Create a package. The nested route (`POST /api/apps/:app_id/pkgs`) creates a package from an
   * uploaded deb, rpm or AppImage file, while the flat route (`POST /api/pkgs`) takes the
   * attributes from the request body.
   */
  async store(context: HttpContext) {
    if (context.params.app_id) return this.storeFromUpload(context)

    const { request, response, serialize } = context
    const pkg = await Pkg.create(await this.attributes(request))
    await pkg.load('app')
    response.created()
    return serialize(PkgTransformer.transform(pkg))
  }

  /**
   * Create a package by uploading a deb, rpm or AppImage file. The name, version, release and
   * architecture are read from the file itself.
   */
  private async storeFromUpload({ auth, params, request, response, serialize }: HttpContext) {
    const application = await App.findOrFail(params.app_id)
    const file = await this.receivePackageFile(request)

    if (!file.isValid) {
      await this.discardFile(file)
      throw new Exception(file.errors[0]?.message ?? 'A valid package file is required', {
        status: 422,
      })
    }

    const metadata = await this.extractPackage(file)
    const fileName = this.packageFileName(file.clientName, metadata.checksum)
    const path = `packages/${fileName}`

    await file.move(app.makePath('storage', 'packages'), { name: fileName, overwrite: true })

    const pkg = await Pkg.create({
      appId: application.id,
      userId: auth.getUserOrFail().id,
      type: metadata.type,
      name: metadata.name,
      version: metadata.version,
      release: metadata.release,
      arch: metadata.arch,
      size: metadata.size,
      checksum: metadata.checksum,
      checksumType: metadata.checksumType,
      path,
      downloadUrl: `/uploads/${path}`,
    })

    await pkg.load('app')
    response.status(201)
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
    const path = pkg.path

    await pkg.delete()
    if (path) await this.deleteStoredFile(path)

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

  /**
   * Stream the uploaded file to the tmp directory. The route is listed under "processManually" in
   * the bodyparser config, so the multipart stream is consumed here with its own limit.
   */
  private async receivePackageFile(request: HttpContext['request']) {
    request.multipart.onFile('file', { deferValidations: true }, async (part, reportChunk) => {
      const tmpPath = app.tmpPath(`pkghub-${randomUUID()}`)

      await pipeline(
        part,
        new Transform({
          transform(chunk: Buffer, _encoding, callback) {
            reportChunk(chunk)
            callback(null, chunk)
          },
        }),
        createWriteStream(tmpPath),
      )

      return { tmpPath }
    })

    await request.multipart.process({ limit: maxPackageSize })

    const file = request.file('file', { size: maxPackageSize })
    if (!file) {
      throw new Exception('A valid package file is required', { status: 422 })
    }
    return file
  }

  private packageFileName(clientName: string, checksum: string) {
    const safeName = basename(clientName)
      .replace(/[^\w.@+-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(-100)

    return `${checksum.slice(0, 12)}-${safeName || 'package'}`
  }

  /**
   * Read the package metadata. Rejected uploads are removed from the tmp directory instead of being
   * left behind on the disk.
   */
  private async extractPackage(file: MultipartFile) {
    const tmpPath = file.tmpPath
    if (!tmpPath) {
      throw new Exception('A valid package file is required', { status: 422 })
    }

    try {
      return await new PackageFileExtractor().extract(tmpPath, file.clientName)
    } catch (error) {
      await this.discardFile(file)
      throw error
    }
  }

  private async discardFile(file: { tmpPath?: string }) {
    if (!file.tmpPath) return
    await unlink(file.tmpPath).catch(() => undefined)
  }

  /**
   * File names are content addressed, so the same file may back several package entries. The file
   * is only removed once nothing else points at it.
   */
  private async deleteStoredFile(path: string) {
    const referenced = await Pkg.query().where('path', path).first()
    if (!referenced) await drive.use().delete(path)
  }
}
