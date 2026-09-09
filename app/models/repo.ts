import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'

import { RepoSchema } from '#database/schema'
import Pkg from '#models/pkg'
import RepoTarget from '#models/repo_target'

export default class Repo extends RepoSchema {
  declare type: 'rpm' | 'deb'

  @hasMany(() => Pkg)
  declare packages: HasMany<typeof Pkg>

  @hasMany(() => RepoTarget)
  declare targets: HasMany<typeof RepoTarget>
}
