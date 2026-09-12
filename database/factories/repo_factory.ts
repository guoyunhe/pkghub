import factory from '@adonisjs/lucid/factories'

import Repo from '#models/repo'

export const RepoFactory = factory
  .define(Repo, async () => {
    return {}
  })
  .build()
