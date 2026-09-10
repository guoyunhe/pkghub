import { gunzipSync, zstdDecompressSync } from 'node:zlib'

import { XMLParser } from 'fast-xml-parser'
import xior, { isXiorError } from 'xior'

import type Repo from '#models/repo'

export type RepoPackageType = 'rpm' | 'deb'

export type ExtractedPackage = {
  type: RepoPackageType
  name: string
  version: string | null
  release: string | null
  arch: string | null
  downloadUrl: string
  checksum: string | null
  checksumType: string | null
  size: number | null
}

export type ExtractOptions = {
  arch?: string
}

type DebSource = {
  uri: string
  suite: string
  components: string[]
  arch: string | null
}

type XmlDataEntry = {
  '@_type'?: string
  location?: { '@_href'?: string }
}

type XmlChecksum =
  | string
  | {
      '#text'?: string
      '@_type'?: string
    }
  | undefined

type XmlRpmPackage = {
  name?: string
  arch?: string
  version?: { '@_ver'?: string; '@_rel'?: string }
  location?: { '@_href'?: string }
  checksum?: XmlChecksum
  size?: { '@_package'?: string }
}

const requestHeaders = { Accept: '*/*', 'User-Agent': 'curl/8.0' }

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const trimmed = String(value).trim()
  return trimmed ? trimmed : null
}

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

function parseDebStanzas(content: string): Record<string, string>[] {
  return content
    .split(/\n\s*\n/)
    .map((block) => {
      const fields: Record<string, string> = {}
      for (const line of block.split('\n')) {
        if (/^\s/.test(line) || !line.includes(':')) continue
        const separator = line.indexOf(':')
        const key = line.slice(0, separator)
        const value = line.slice(separator + 1).trim()
        if (key) fields[key] = value
      }
      return fields
    })
    .filter((fields) => fields.Package && fields.Filename)
}

export default class RepoPackageExtractor {
  private xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (tagName) => tagName === 'data' || tagName === 'package',
  })

  async extract(repo: Repo, options: ExtractOptions = {}): Promise<ExtractedPackage[]> {
    if (repo.type === 'rpm') return this.extractRpm(repo)
    if (repo.type === 'deb') return this.extractDeb(repo, options.arch ?? null)
    throw new Error(`Unsupported repository type "${repo.type}": expected "rpm" or "deb"`)
  }

  private async extractRpm(repo: Repo): Promise<ExtractedPackage[]> {
    const repomdUrl = joinUrl(repo.baseUrl, 'repodata/repomd.xml')
    const repomd = await this.downloadText(repomdUrl)
    const parsedRepomd = this.xmlParser.parse(repomd) as unknown as {
      repomd?: { data?: XmlDataEntry[] }
    }
    const entries = parsedRepomd.repomd?.data ?? []
    const primaryEntry = entries.find((entry) => entry['@_type'] === 'primary')
    const href = primaryEntry?.location?.['@_href']
    if (!href) throw new Error(`Primary package metadata not found in ${repomdUrl}`)

    const primaryUrl = joinUrl(repo.baseUrl, href)
    const primaryXml = await this.downloadText(primaryUrl)
    const parsedPrimary = this.xmlParser.parse(primaryXml) as unknown as {
      metadata?: { package?: XmlRpmPackage[] }
    }
    const packages = parsedPrimary.metadata?.package ?? []

    return packages
      .map((entry): ExtractedPackage | null => {
        const location = entry.location?.['@_href']
        if (!entry.name || !location) return null
        const checksum = this.readChecksum(entry.checksum)
        return {
          type: 'rpm',
          name: entry.name,
          version: text(entry.version?.['@_ver']),
          release: text(entry.version?.['@_rel']),
          arch: text(entry.arch),
          downloadUrl: joinUrl(repo.baseUrl, location),
          checksum: checksum.checksum,
          checksumType: checksum.checksumType,
          size: this.readNumber(entry.size?.['@_package']),
        }
      })
      .filter((pkg): pkg is ExtractedPackage => pkg !== null)
  }

  private async extractDeb(repo: Repo, archOverride: string | null): Promise<ExtractedPackage[]> {
    const requestedArch = archOverride ? this.toDebArch(archOverride) : null
    const sources = this.sourcesFor(repo, requestedArch)
    const seen = new Set<string>()
    const result: ExtractedPackage[] = []

    for (const source of sources) {
      const indexUrls =
        source.suite === '.' || source.suite === './'
          ? [joinUrl(source.uri, 'Packages.gz')]
          : source.components.map((component) =>
              joinUrl(
                source.uri,
                `dists/${source.suite}/${component}/binary-${source.arch}/Packages.gz`,
              ),
            )

      for (const url of indexUrls) {
        // Empty suites/components simply have no Packages index; apt skips them too.
        const content = await this.downloadText(url, { optional: true })
        if (content === null) continue
        for (const stanza of parseDebStanzas(content)) {
          const version = this.splitDebVersion(stanza.Version)
          const arch = text(stanza.Architecture)
          const key = `${stanza.Package}|${stanza.Version}|${arch ?? ''}`
          if (seen.has(key)) continue
          seen.add(key)
          result.push({
            type: 'deb',
            name: stanza.Package,
            version: version.version,
            release: version.release,
            arch: arch ? this.fromDebArch(arch) : null,
            downloadUrl: joinUrl(source.uri, stanza.Filename),
            checksum: stanza.SHA256 ?? stanza.SHA1 ?? stanza.MD5sum ?? null,
            checksumType: stanza.SHA256
              ? 'sha256'
              : stanza.SHA1
                ? 'sha1'
                : stanza.MD5sum
                  ? 'md5'
                  : null,
            size: this.readNumber(stanza.Size),
          })
        }
      }
    }

    return result
  }

  private sourcesFor(repo: Repo, requestedArch: string | null): Required<DebSource>[] {
    const parsed = this.parseDebSources(repo.repositoryFile)
    const matching = parsed.filter((source) => this.sameBase(source.uri, repo.baseUrl))
    const selected = matching.length > 0 ? matching : parsed

    if (selected.length === 0) {
      // No deb line available: assume a flat repository with Packages.gz at the root.
      return [
        {
          uri: repo.baseUrl.replace(/\/+$/, ''),
          suite: './',
          components: [],
          arch: requestedArch ?? 'amd64',
        },
      ]
    }

    return selected.map((source) => ({
      uri: source.uri.replace(/\/+$/, ''),
      suite: source.suite,
      components: source.components,
      arch: requestedArch ?? source.arch ?? 'amd64',
    }))
  }

  private parseDebSources(repositoryFile: string | null): DebSource[] {
    if (!repositoryFile) return []
    const sources: DebSource[] = []

    for (const rawLine of repositoryFile.split('\n')) {
      const line = rawLine.trim()
      if (!line.startsWith('deb ')) continue

      let rest = line.slice(4).trim()
      let optionArch: string | null = null

      if (rest.startsWith('[')) {
        const end = rest.indexOf(']')
        if (end === -1) continue
        const options = rest.slice(1, end).split(/\s+/)
        rest = rest.slice(end + 1).trim()
        const archOption = options.find((option) => option.startsWith('arch='))
        optionArch = archOption?.slice('arch='.length).split(',')[0] ?? null
      }

      const [uri, suite, ...components] = rest.split(/\s+/)
      if (!uri || !suite) continue
      if (suite !== '.' && suite !== './' && components.length === 0) continue

      sources.push({ uri, suite, components, arch: optionArch })
    }

    return sources
  }

  private splitDebVersion(value: string | undefined): {
    version: string | null
    release: string | null
  } {
    const upstream = text(value)
    if (!upstream) return { version: null, release: null }
    const withoutEpoch = upstream.includes(':')
      ? upstream.slice(upstream.indexOf(':') + 1)
      : upstream
    const dash = withoutEpoch.lastIndexOf('-')
    return dash === -1
      ? { version: withoutEpoch, release: null }
      : {
          version: withoutEpoch.slice(0, dash),
          release: withoutEpoch.slice(dash + 1),
        }
  }

  private readChecksum(node: XmlChecksum): {
    checksum: string | null
    checksumType: string | null
  } {
    if (typeof node === 'string') return { checksum: text(node), checksumType: null }
    if (node) {
      return {
        checksum: text(node['#text']),
        checksumType: text(node['@_type']),
      }
    }
    return { checksum: null, checksumType: null }
  }

  private readNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  private toDebArch(arch: string) {
    switch (arch) {
      case 'x86_64':
        return 'amd64'
      case 'aarch64':
        return 'arm64'
      default:
        return arch
    }
  }

  private fromDebArch(arch: string) {
    switch (arch) {
      case 'amd64':
        return 'x86_64'
      case 'arm64':
        return 'aarch64'
      default:
        return arch
    }
  }

  private sameBase(uri: string, baseUrl: string) {
    const normalize = (value: string) => value.replace(/\/+$/, '').replace(/^https?:/, '')
    return normalize(uri) === normalize(baseUrl)
  }

  private async downloadText(url: string): Promise<string>
  private async downloadText(url: string, options: { optional: true }): Promise<string | null>
  private async downloadText(
    url: string,
    options: { optional?: boolean } = {},
  ): Promise<string | null> {
    let data: Buffer
    try {
      const response = await xior.get<ArrayBuffer>(url, {
        responseType: 'arraybuffer',
        headers: requestHeaders,
      })
      data = Buffer.from(response.data)
    } catch (error) {
      const status = isXiorError(error) ? error.response?.status : undefined
      if (options.optional && (status === 404 || status === 410)) return null
      throw new Error(`Unable to download ${url}${status ? ` (${status})` : ''}`, {
        cause: error,
      })
    }

    if (url.endsWith('.gz')) return gunzipSync(data).toString('utf8')
    if (url.endsWith('.zst')) return zstdDecompressSync(data).toString('utf8')
    if (/\.(xz|zck|bz2)$/.test(url)) {
      throw new Error(`Unsupported repository metadata compression: ${url}`)
    }
    return data.toString('utf8')
  }
}
