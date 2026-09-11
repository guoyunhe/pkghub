import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import { ReviewSchema } from '#database/schema'
import App from '#models/app'
import User from '#models/user'

export default class Review extends ReviewSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => App)
  declare app: BelongsTo<typeof App>
}
