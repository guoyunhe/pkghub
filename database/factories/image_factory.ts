import factory from '@adonisjs/lucid/factories'

import Image from '#models/image'

export const ImageFactory = factory
  .define(Image, async () => {
    return {}
  })
  .build()
