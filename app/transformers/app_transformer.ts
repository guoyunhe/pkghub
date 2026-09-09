import { BaseTransformer } from '@adonisjs/core/transformers'

import App from '#models/app'

export default class AppTransformer extends BaseTransformer<App> {
  toObject() {
    return this.pick(this.resource, ['id'])
  }
}
