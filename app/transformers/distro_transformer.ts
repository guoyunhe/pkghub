import { BaseTransformer } from '@adonisjs/core/transformers'

import type Distro from '#models/distro'

export default class DistroTransformer extends BaseTransformer<Distro> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'version', 'releaseDate', 'eolDate']),
    }
  }
}
