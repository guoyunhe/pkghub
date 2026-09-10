import { BaseTransformer } from '@adonisjs/core/transformers'

import type Repo from '#models/repo'

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
      distro: this.resource.distro
        ? { id: this.resource.distro.id, name: this.resource.distro.name }
        : null,
    }
  }
}
