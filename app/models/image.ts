import { readFile } from 'node:fs/promises'
import { get as httpGet } from 'node:http'
import { get as httpsGet } from 'node:https'

import { Exception } from '@adonisjs/core/exceptions'
import drive from '@adonisjs/drive/services/main'
import sharp, { type FitEnum, type FormatEnum } from 'sharp'

import { ImageSchema } from '#database/schema'

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024

export type ImageOptions = {
  userId?: number | null
  path?: string
  width?: number
  height?: number
  fit?: keyof FitEnum
  format?: keyof FormatEnum
  maxSize?: number
  acceptedFormats?: ReadonlyArray<'svg' | 'png' | 'jpeg' | 'webp' | 'avif' | 'gif'>
  minimumPngSize?: number
}

type RequestFile = { tmpPath?: string; isValid: boolean }

export default class Image extends ImageSchema {
  static async createFromLocalFile(filePath: string, options: ImageOptions = {}) {
    return this.createFromBuffer(await readFile(filePath), options)
  }

  static async createFromUrl(url: string, options: ImageOptions = {}) {
    return this.createFromBuffer(await this.download(url), options)
  }

  static async createFromRequestFile(file: RequestFile, options: ImageOptions = {}) {
    if (!file.isValid || !file.tmpPath) {
      throw new Exception('A valid image file is required', { status: 422 })
    }
    return this.createFromLocalFile(file.tmpPath, options)
  }

  static async replaceFromRequestFile(image: Image, file: RequestFile, options: ImageOptions = {}) {
    if (!file.isValid || !file.tmpPath) {
      throw new Exception('A valid image file is required', { status: 422 })
    }
    return this.replaceFromBuffer(image, await readFile(file.tmpPath), options)
  }

  static async replaceFromUrl(image: Image, url: string, options: ImageOptions = {}) {
    return this.replaceFromBuffer(image, await this.download(url), options)
  }

  private static async createFromBuffer(data: Buffer, options: ImageOptions) {
    const attributes = await this.process(data, options)
    return this.create(attributes)
  }

  private static async replaceFromBuffer(image: Image, data: Buffer, options: ImageOptions) {
    const previousPath = image.path
    const attributes = await this.process(data, options)
    await image.merge(attributes).save()
    if (previousPath !== image.path) await drive.use().delete(previousPath)
    return image
  }

  private static async process(data: Buffer, options: ImageOptions) {
    const maxSize = options.maxSize ?? DEFAULT_MAX_SIZE
    const sourceMetadata = await sharp(data).metadata()
    const preserveSvg =
      sourceMetadata.format === 'svg' && !options.width && !options.height && !options.format
    let outputData = data
    let { format, width, height } = sourceMetadata

    if (!preserveSvg) {
      let processor = sharp(data).rotate()
      if (options.width || options.height) {
        processor = processor.resize({
          width: options.width,
          height: options.height,
          fit: options.fit,
        })
      }
      if (options.format) processor = processor.toFormat(options.format)

      const output = await processor.toBuffer({ resolveWithObject: true })
      outputData = output.data
      ;({ format, width, height } = output.info)
    }

    if (!format || !width || !height) throw new Error('Unable to determine image metadata')
    if (outputData.length > maxSize) {
      throw new Exception(`Image exceeds the ${maxSize / 1024 / 1024} MB size limit`, {
        status: 422,
      })
    }
    if (options.acceptedFormats && !options.acceptedFormats.includes(format)) {
      throw new Error(`Unsupported image format: ${format}`)
    }
    if (
      format === 'png' &&
      options.minimumPngSize &&
      Math.min(width, height) < options.minimumPngSize
    ) {
      throw new Error(`PNG image must be at least ${options.minimumPngSize}px`)
    }

    const extension = format === 'jpeg' ? 'jpg' : format
    const path = options.path ?? `images/${crypto.randomUUID()}.${extension}`
    await drive.use().put(path, outputData)

    return {
      userId: options.userId ?? null,
      path,
      size: outputData.length,
      width,
      height,
      mimeType: format === 'svg' ? 'image/svg+xml' : `image/${format}`,
    }
  }

  private static download(url: string) {
    return new Promise<Buffer>((resolve, reject) => {
      const parsedUrl = new URL(url)
      const request =
        parsedUrl.protocol === 'https:' ? httpsGet : parsedUrl.protocol === 'http:' ? httpGet : null
      if (!request) {
        reject(new Error(`Unsupported image URL protocol: ${parsedUrl.protocol}`))
        return
      }

      request(url, { headers: { Accept: 'image/*', 'User-Agent': 'curl/8.0' } }, (response) => {
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          response.resume()
          reject(new Error(`Unable to download image: ${url} (${response.statusCode})`))
          return
        }

        const chunks: Buffer[] = []
        response.on('data', (chunk: Buffer) => chunks.push(chunk))
        response.on('end', () => resolve(Buffer.concat(chunks)))
      }).on('error', reject)
    })
  }
}
