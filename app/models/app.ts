import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

import { AppSchema } from '#database/schema'
import Image from '#models/image'
import Pkg from '#models/pkg'

export default class App extends AppSchema {
  @belongsTo(() => Image, { foreignKey: 'iconId' })
  declare icon: BelongsTo<typeof Image>

  @hasMany(() => Pkg)
  declare packages: HasMany<typeof Pkg>
}
