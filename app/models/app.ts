import { belongsTo, type BelongsTo } from '@adonisjs/lucid/orm'

import { AppSchema } from '#database/schema'
import Image from '#models/image'

export default class App extends AppSchema {
  @belongsTo(() => Image, { foreignKey: 'iconId' })
  declare icon: BelongsTo<typeof Image>
}
