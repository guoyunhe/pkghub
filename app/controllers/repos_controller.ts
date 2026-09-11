import type { HttpContext } from '@adonisjs/core/http'

import Repo from '#models/repo'
import RepoTransformer from '#transformers/repo_transformer'
import { repoValidator } from '#validators/repo'

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
    const payload = await request.validateUsing(repoValidator)

    const repo = await Repo.create(payload)
    await repo.load('distro')
    response.created()
    return serialize(RepoTransformer.transform(repo))
  }

  async update({ params, request, serialize }: HttpContext) {
    const repo = await Repo.findOrFail(params.id)
    const payload = await request.validateUsing(repoValidator, { meta: { repoId: repo.id } })

    await repo.merge(payload).save()
    await repo.load('distro')
    return serialize(RepoTransformer.transform(repo))
  }

  async destroy({ params, response }: HttpContext) {
    const repo = await Repo.findOrFail(params.id)
    await repo.delete()
    return response.noContent()
  }
}
