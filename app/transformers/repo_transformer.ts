import { BaseTransformer } from '@adonisjs/core/transformers'

import type Repo from '#models/repo'

export default class RepoTransformer extends BaseTransformer<Repo> {
  toObject() {
    return this.pick(this.resource, ['id'])
  }
}
