import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import { PkgSchema } from '#database/schema'
import App from '#models/app'
import Repo from '#models/repo'

export default class Pkg extends PkgSchema {
  @belongsTo(() => App)
  declare app: BelongsTo<typeof App>

  @belongsTo(() => Repo)
  declare repo: BelongsTo<typeof Repo>
}
