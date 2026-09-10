import { BaseTransformer } from '@adonisjs/core/transformers'

import type Repo from '#models/repo'
import DistroTransformer from '#transformers/distro_transformer'

export default class RepoTransformer extends BaseTransformer<Repo> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'distroId',
        'type',
        'name',
        'baseUrl',
        'keyUrl',
        'keyFingerprint',
        'repositoryFile',
        'enabled',
        'priority',
        'syncIntervalDays',
        'lastSyncedAt',
        'createdAt',
        'updatedAt',
      ]),
      distro: this.resource.distro ? DistroTransformer.transform(this.resource.distro) : null,
    }
  }
}
