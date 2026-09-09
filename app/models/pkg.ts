import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

import { PkgSchema } from '#database/schema'
import App from '#models/app'
import PkgTarget from '#models/pkg_target'
import Repo from '#models/repo'

export default class Pkg extends PkgSchema {
  @belongsTo(() => App)
  declare app: BelongsTo<typeof App>

  @belongsTo(() => Repo)
  declare repo: BelongsTo<typeof Repo>

  @hasMany(() => PkgTarget)
  declare targets: HasMany<typeof PkgTarget>
}
