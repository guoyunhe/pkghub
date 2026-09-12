import { belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

import { AppSchema } from '#database/schema'
import Category from '#models/category'
import Image from '#models/image'
import Pkg from '#models/pkg'
import Review from '#models/review'
import User from '#models/user'

export default class App extends AppSchema {
  @belongsTo(() => Image, { foreignKey: 'iconId' })
  declare icon: BelongsTo<typeof Image>

  @hasMany(() => Pkg)
  declare packages: HasMany<typeof Pkg>

  @hasMany(() => Review)
  declare reviews: HasMany<typeof Review>

  @manyToMany(() => Category, {
    pivotTable: 'app_categories',
    pivotForeignKey: 'app_id',
    pivotRelatedForeignKey: 'category_id',
  })
  declare categories: ManyToMany<typeof Category>

  @manyToMany(() => User, { pivotTable: 'favorites' })
  declare favoritedBy: ManyToMany<typeof User>
}
