import { Exception } from '@adonisjs/core/exceptions';
import type { HttpContext } from '@adonisjs/core/http';
import drive from '@adonisjs/drive/services/main';
import sharp, { type FitEnum, type FormatEnum } from 'sharp';

import Image from '#models/image';
import ImageTransformer from '#transformers/image_transformer';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'];
const fitModes = ['contain', 'cover', 'fill', 'inside', 'outside'] as const;
const outputFormats = ['jpeg', 'png', 'webp', 'avif'] as const;

type FitMode = (typeof fitModes)[number];
type OutputFormat = (typeof outputFormats)[number];

export default class ImagesController {
  async index({ auth, serialize }: HttpContext) {
    const images = await Image.query()
      .where('user_id', auth.getUserOrFail().id)
      .orderBy('id', 'desc');

    return serialize(ImageTransformer.transform(images));
  }

  async show({ auth, params, serialize }: HttpContext) {
    const image = await this.findUserImage(params.id, auth.getUserOrFail().id);

    return serialize(ImageTransformer.transform(image));
  }

  async store({ auth, request, response, serialize }: HttpContext) {
    const image = await Image.create(await this.processUpload(request, auth.getUserOrFail().id));

    response.created();
    return serialize(ImageTransformer.transform(image));
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const image = await this.findUserImage(params.id, auth.getUserOrFail().id);
    const replacement = await this.processUpload(request, image.userId!);

    const oldPath = image.path;
    await image.merge(replacement).save();
    await drive.use().delete(oldPath);

    return serialize(ImageTransformer.transform(image));
  }

  async destroy({ auth, params, response }: HttpContext) {
    const image = await this.findUserImage(params.id, auth.getUserOrFail().id);

    await drive.use().delete(image.path);
    await image.delete();

    return response.noContent();
  }

  private async findUserImage(id: number, userId: number) {
    return Image.query().where('id', id).where('user_id', userId).firstOrFail();
  }

  private async processUpload(request: HttpContext['request'], userId: number) {
    const upload = request.file('image', {
      size: `${MAX_IMAGE_SIZE / 1024 / 1024}mb`,
      extnames: imageExtensions,
    });

    if (!upload?.tmpPath || !upload.isValid) {
      throw new Exception('A valid image file is required', { status: 422 });
    }

    const { width, height, fit, format } = this.parseOptions(request);
    let processor = sharp(upload.tmpPath).rotate();

    if (width || height) {
      processor = processor.resize({ width, height, fit: fit as keyof FitEnum });
    }
    if (format) {
      processor = processor.toFormat(format as keyof FormatEnum);
    }

    const output = await processor.toBuffer({ resolveWithObject: true });
    if (output.info.size > MAX_IMAGE_SIZE) {
      throw new Exception('The processed image exceeds the 10 MB size limit', { status: 422 });
    }

    const extension = output.info.format === 'jpeg' ? 'jpg' : output.info.format;
    const path = `images/${crypto.randomUUID()}.${extension}`;
    await drive.use().put(path, output.data);

    return {
      userId,
      path,
      size: output.info.size,
      width: output.info.width,
      height: output.info.height,
      mimeType: `image/${output.info.format}`,
    };
  }

  private parseOptions(request: HttpContext['request']) {
    const parseDimension = (name: 'width' | 'height') => {
      const value = request.input(name);
      if (value === undefined || value === null || value === '') return undefined;
      const dimension = Number(value);
      if (!Number.isInteger(dimension) || dimension < 1 || dimension > 10000) {
        throw new Exception(`${name} must be an integer between 1 and 10000`, { status: 422 });
      }
      return dimension;
    };

    const fit = request.input('fit');
    if (fit !== undefined && !fitModes.includes(fit)) {
      throw new Exception(`fit must be one of: ${fitModes.join(', ')}`, { status: 422 });
    }

    const format = request.input('format');
    if (format !== undefined && !outputFormats.includes(format)) {
      throw new Exception(`format must be one of: ${outputFormats.join(', ')}`, { status: 422 });
    }

    return {
      width: parseDimension('width'),
      height: parseDimension('height'),
      fit: fit as FitMode | undefined,
      format: format as OutputFormat | undefined,
    };
  }
}
