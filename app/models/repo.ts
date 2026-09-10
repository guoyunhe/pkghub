import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'

import { RepoSchema } from '#database/schema'
import Distro from '#models/distro'
import Pkg from '#models/pkg'

export default class Repo extends RepoSchema {
  @belongsTo(() => Distro)
  declare distro: BelongsTo<typeof Distro>

  @hasMany(() => Pkg)
  declare packages: HasMany<typeof Pkg>
}
