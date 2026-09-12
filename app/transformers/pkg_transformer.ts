import { BaseTransformer } from '@adonisjs/core/transformers'

import type Pkg from '#models/pkg'

export default class PkgTransformer extends BaseTransformer<Pkg> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'type',
        'name',
        'version',
        'release',
        'arch',
        'license',
        'summary',
        'description',
        'downloadUrl',
        'checksum',
        'checksumType',
        'size',
        'installCommand',
      ]),
      // Uploaded package files are served from the local disk, keyed by their stored path.
      url: this.resource.path ? `/uploads/${this.resource.path}` : null,
      app: this.resource.app ? { id: this.resource.app.id, name: this.resource.app.name } : null,
    }
  }
}
