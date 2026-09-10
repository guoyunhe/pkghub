import type { HttpContext } from '@adonisjs/core/http'

import Distro from '#models/distro'
import DistroTransformer from '#transformers/distro_transformer'

export default class DistrosController {
  async index({ serialize }: HttpContext) {
    const distros = await Distro.query().orderBy('name')
    return serialize(DistroTransformer.transform(distros))
  }
}
