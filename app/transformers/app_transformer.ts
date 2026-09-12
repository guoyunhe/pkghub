import { BaseTransformer } from '@adonisjs/core/transformers'

import type App from '#models/app'
import ImageTransformer from '#transformers/image_transformer'

export default class AppTransformer extends BaseTransformer<App> {
  toObject() {
    const avgRating = this.resource.$extras.avgRating
    return {
      ...this.pick(this.resource, [
        'id',
        'name',
        'summary',
        'version',
        'license',
        'homepage',
        'appstreamId',
        'appstreamUrl',
        'appstreamContent',
        'desktopUrl',
        'desktopContent',
        'iconId',
      ]),
      icon: this.resource.icon ? ImageTransformer.transform(this.resource.icon) : null,
      categories: (this.resource.categories ?? []).map((category) => ({
        id: category.id,
        code: category.code,
        name: category.name,
        parentId: category.parentId,
      })),
      isFavorite: this.resource.favoritedBy ? this.resource.favoritedBy.length > 0 : false,
      avgRating: avgRating === null || avgRating === undefined ? null : Number(avgRating),
    }
  }
}
