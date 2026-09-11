import factory from '@adonisjs/lucid/factories'

import Review from '#models/review'

const comments = [
  'Works out of the box, no extra configuration needed.',
  'Fast and lightweight, a pleasure to use.',
  'Great app, though the UI could use some polish.',
  'Exactly what I was looking for.',
  'Reliable and well maintained, highly recommended.',
  'A bit confusing at first, but very powerful once you learn it.',
  'Crashed once or twice, otherwise solid.',
  'The best option available for this task.',
  'Documentation could be better, but the app itself is great.',
  'Nice interface and great performance.',
  'Does the job well, no complaints.',
  'I use it every day, it has become essential for me.',
  'Slightly buggy on my setup, but still useful.',
  'Simple, focused, and effective.',
  'Impressive feature set for a free tool.',
  'Not perfect, but it gets better with every release.',
]

const ratings = [5, 5, 5, 4, 4, 4, 3, 3, 5, 4, 2]

export const ReviewFactory = factory
  .define(Review, async ({ faker }) => {
    return {
      rating: faker.helpers.arrayElement(ratings),
      comment: faker.helpers.arrayElement([...comments, null]),
    }
  })
  .build()
