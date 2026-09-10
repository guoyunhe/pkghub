import { BaseTransformer } from '@adonisjs/core/transformers'

import type Pkg from '#models/pkg'

export default class PkgTransformer extends BaseTransformer<Pkg> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'type',
      'name',
      'version',
      'release',
      'arch',
      'downloadUrl',
      'checksum',
      'checksumType',
      'size',
      'installCommand',
    ])
  }
}
