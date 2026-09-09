import factory from '@adonisjs/lucid/factories'
import Pkg from '#models/pkg'

export const PkgFactory = factory
  .define(Pkg, async ({ faker }) => {
    return {}
  })
  .build()