import type { HttpContext } from '@adonisjs/core/http'

import App from '#models/app'
import Review from '#models/review'
import User from '#models/user'
import ReviewTransformer from '#transformers/review_transformer'
import { reviewValidator } from '#validators/review'

export default class ReviewsController {
  async index({ params, request, serialize }: HttpContext) {
    await App.findOrFail(params.id)
    const page = this.positiveInteger(request.input('page'), 1)
    const perPage = Math.min(this.positiveInteger(request.input('perPage'), 12), 50)

    const paginator = await Review.query()
      .where('appId', params.id)
      .preload('user')
      .orderBy('createdAt', 'desc')
      .paginate(page, perPage)

    return serialize(ReviewTransformer.paginate(paginator.all(), paginator.getMeta()))
  }

  async userIndex({ params, request, serialize }: HttpContext) {
    await User.findOrFail(params.id)
    const page = this.positiveInteger(request.input('page'), 1)
    const perPage = Math.min(this.positiveInteger(request.input('perPage'), 12), 50)

    const paginator = await Review.query()
      .where('userId', params.id)
      .preload('app')
      .orderBy('createdAt', 'desc')
      .paginate(page, perPage)

    return serialize(ReviewTransformer.paginate(paginator.all(), paginator.getMeta()))
  }

  async store({ auth, params, request, response, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const app = await App.findOrFail(params.id)
    const payload = await request.validateUsing(reviewValidator)

    const review = await Review.updateOrCreate(
      { userId: user.id, appId: app.id },
      { rating: payload.rating, comment: payload.comment?.trim() || null },
    )
    await review.load('user')

    response.created()
    return serialize(ReviewTransformer.transform(review))
  }

  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await App.findOrFail(params.id)

    const review = await Review.query().where('userId', user.id).where('appId', params.id).first()

    if (!review) return response.noContent()
    await review.delete()
    return response.noContent()
  }

  private positiveInteger(value: unknown, fallback: number) {
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
  }
}
