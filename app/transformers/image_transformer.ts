import { BaseTransformer } from '@adonisjs/core/transformers';

import Image from '#models/image';

export default class ImageTransformer extends BaseTransformer<Image> {
  toObject() {
    return this.pick(this.resource, ['id']);
  }
}
