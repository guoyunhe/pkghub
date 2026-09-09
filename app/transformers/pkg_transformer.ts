import { BaseTransformer } from '@adonisjs/core/transformers';

import Pkg from '#models/pkg';

export default class PkgTransformer extends BaseTransformer<Pkg> {
  toObject() {
    return this.pick(this.resource, ['id']);
  }
}
