import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

import Distro from '#models/distro'
import Repo from '#models/repo'
import RepoTransformer from '#transformers/repo_transformer'

const repoTypes = ['deb', 'rpm', 'flatpak', 'snap'] as const

export default class ReposController {
  async index({ serialize }: HttpContext) {
    const repos = await Repo.query().preload('distro').orderBy('type').orderBy('name')
    return serialize(RepoTransformer.transform(repos))
  }

  async show({ params, serialize }: HttpContext) {
    const repo = await Repo.query().where('id', params.id).preload('distro').firstOrFail()
    return serialize(RepoTransformer.transform(repo))
  }

  async store({ request, response, serialize }: HttpContext) {
    const repo = await Repo.create(await this.attributes(request))
    await repo.load('distro')
    response.created()
    return serialize(RepoTransformer.transform(repo))
  }

  async update({ params, request, serialize }: HttpContext) {
    const repo = await Repo.findOrFail(params.id)
    await repo.merge(await this.attributes(request, repo)).save()
    await repo.load('distro')
    return serialize(RepoTransformer.transform(repo))
  }

  async destroy({ params, response }: HttpContext) {
    const repo = await Repo.findOrFail(params.id)
    await repo.delete()
    return response.noContent()
  }

  private async attributes(request: HttpContext['request'], repo?: Repo) {
    const name = this.requiredString(request.input('name'), 'name')
    const baseUrl = this.requiredString(request.input('baseUrl'), 'baseUrl')
    const type = this.requiredString(request.input('type'), 'type')
    if (!repoTypes.includes(type as (typeof repoTypes)[number])) {
      throw new Exception(`type must be one of ${repoTypes.join(', ')}`, { status: 422 })
    }

    const distroId = this.optionalPositiveInteger(request.input('distroId'))
    if (distroId) {
      await Distro.findOrFail(distroId)
    }

    const uniqueQuery = Repo.query().where('name', name)
    if (repo) uniqueQuery.andWhereNot('id', repo.id)
    if (await uniqueQuery.first()) {
      throw new Exception('A repository with this name already exists', { status: 422 })
    }

    return {
      name,
      baseUrl,
      type,
      distroId,
      configContent: this.optionalString(request.input('configContent')),
      syncIntervalDays: this.optionalPositiveInteger(request.input('syncIntervalDays')),
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

  private optionalPositiveInteger(value: unknown) {
    if (value === undefined || value === null || value === '') return null
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new Exception('Value must be a non-negative integer', { status: 422 })
    }
    return parsed
  }
}
