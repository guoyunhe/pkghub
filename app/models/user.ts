import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

import { UserSchema } from '#database/schema'
import App from '#models/app'
import Review from '#models/review'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  static accessTokens = DbAccessTokensProvider.forModel(User)
  declare currentAccessToken?: AccessToken

  @manyToMany(() => App, { pivotTable: 'favorites' })
  declare favoriteApps: ManyToMany<typeof App>

  @hasMany(() => Review)
  declare reviews: HasMany<typeof Review>
}
