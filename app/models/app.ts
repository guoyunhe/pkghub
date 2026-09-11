import { belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

import { AppSchema } from '#database/schema'
import Image from '#models/image'
import Pkg from '#models/pkg'
import User from '#models/user'

export default class App extends AppSchema {
  @belongsTo(() => Image, { foreignKey: 'iconId' })
  declare icon: BelongsTo<typeof Image>

  @hasMany(() => Pkg)
  declare packages: HasMany<typeof Pkg>

  @manyToMany(() => User, { pivotTable: 'favorites' })
  declare favoritedBy: ManyToMany<typeof User>
}
