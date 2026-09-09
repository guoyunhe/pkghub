import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AdminMiddleware {
  async handle({ auth }: HttpContext, next: NextFn) {
    if (auth.getUserOrFail().role !== 'admin') {
      throw new Exception('Administrator access is required', { status: 403 })
    }

    return next()
  }
}
