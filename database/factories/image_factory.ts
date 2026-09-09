import factory from '@adonisjs/lucid/factories';

import Image from '#models/image';

export const ImageFactory = factory
  .define(Image, async ({ faker }) => {
    return {};
  })
  .build();
