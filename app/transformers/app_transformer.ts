import { BaseTransformer } from '@adonisjs/core/transformers'

import type App from '#models/app'
import ImageTransformer from '#transformers/image_transformer'

export default class AppTransformer extends BaseTransformer<App> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'name',
        'summary',
        'version',
        'license',
        'appstreamId',
        'appstreamUrl',
        'desktopUrl',
      ]),
      icon: this.resource.icon ? ImageTransformer.transform(this.resource.icon) : null,
      isFavorite: this.resource.favoritedBy ? this.resource.favoritedBy.length > 0 : false,
    }
  }
}
