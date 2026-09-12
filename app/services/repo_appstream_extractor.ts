import { basename } from 'node:path'
import { gunzipSync } from 'node:zlib'

import { XMLBuilder, XMLParser } from 'fast-xml-parser'
import sharp from 'sharp'
import xior, { isXiorError } from 'xior'
import { parse as parseYaml } from 'yaml'

import type Repo from '#models/repo'
import PackageFileExtractor, { normalizePackagePath } from '#services/package_file_extractor'
import RepoPackageExtractor from '#services/repo_package_extractor'
import type { ExtractedPackage, ResolvedDebSource } from '#services/repo_package_extractor'

import { readTarEntries } from '../utils/tar.js'

export type AppstreamIcon = {
  name: string
  width: number | null
  height: number | null
}

export type ExtractedApp = {
  appstreamId: string
  type: string | null
  name: Record<string, string>
  summary: Record<string, string>
  version: string | null
  license: string | null
  homepage: string | null
  /**
   * Category codes of the component (`<categories><category>` / `Categories`). They are identifiers
   * from the freedesktop.org menu specification, e.g. `Game` or `PackageManager`.
   */
  categories: string[]
  /** Package names the component belongs to (`<pkgname>` / `Package`), used to link packages. */
  pkgNames: string[]
  /** AppStream XML of the component, stored as `appstreamContent`. */
  content: string
  /** Icons declared by the metadata, cached ones (which name a file) before themed ones. */
  icons: AppstreamIcon[]
}

/** An application together with the icon its package installs, when it ships a matching one. */
export type PackagedApp = {
  app: ExtractedApp
  icon: Buffer | null
}

/** An AppStream component a package announces through its file list, without any metadata. */
export type InferredComponent = {
  appstreamId: string
  /** Repository packages that ship the component metadata file, with its path inside the package. */
  files: Array<{ pkgName: string; path: string }>
}

/** AppStream component types that describe an application users can install. */
export const desktopAppTypes = ['desktop', 'desktop-application']

/** Identity of an icon inside the icon archive, e.g. `128x128/app.png`. */
export function iconKey(icon: AppstreamIcon) {
  return `${icon.width ?? 0}x${icon.height ?? 0}/${icon.name}`
}

/** Directories packages store their AppStream metadata file in. */
const appstreamFileDirectories = ['/usr/share/metainfo/', '/usr/share/appdata/']

/** Suffixes of an AppStream metadata file; the rest of the file name is the AppStream ID. */
const appstreamFileSuffixes = ['.metainfo.xml', '.appdata.xml']

/**
 * Component ID of a component. Legacy `appdata.xml` files identified a component by the name of its
 * desktop file, so the `.desktop` suffix they carry is dropped; modern IDs cannot have it.
 */
export function canonicalAppstreamId(id: string) {
  return id.endsWith('.desktop') ? id.slice(0, -'.desktop'.length) : id
}

/** Whether two component IDs name the same component. */
function isSameAppstreamId(left: string, right: string) {
  return canonicalAppstreamId(left) === canonicalAppstreamId(right)
}

/**
 * Component IDs a stored application may carry: the canonical one and the legacy `.desktop` form,
 * which older catalogs identify a component by.
 */
export function appstreamIdVariants(id: string) {
  const canonical = canonicalAppstreamId(id)
  return canonical === id ? [id, `${id}.desktop`] : [id, canonical]
}

/**
 * AppStream ID carried by a metadata file path. Packages name their application in the file name,
 * so `/usr/share/metainfo/org.videolan.vlc.appdata.xml` declares `org.videolan.vlc`. Paths that are
 * not AppStream metadata return `null`.
 */
function appstreamFileId(path: string): string | null {
  const trimmed = path.trim()
  if (!appstreamFileDirectories.some((directory) => trimmed.startsWith(directory))) return null

  const name = basename(trimmed)
  for (const suffix of appstreamFileSuffixes) {
    if (!name.endsWith(suffix)) continue
    const id = name.slice(0, -suffix.length).trim()
    return id ? canonicalAppstreamId(id) : null
  }
  return null
}

/** Debian AppStream icon archives, largest first. */
const debIconArchives = [
  'icons-128x128@2.tar.gz',
  'icons-128x128.tar.gz',
  'icons-64x64@2.tar.gz',
  'icons-64x64.tar.gz',
  'icons-48x48@2.tar.gz',
  'icons-48x48.tar.gz',
]

const requestHeaders = { Accept: '*/*', 'User-Agent': 'curl/8.0' }

type XmlNode =
  | string
  | {
      '#text'?: string
      '@_xml:lang'?: string
      '@_type'?: string
      '@_width'?: string
      '@_height'?: string
    }

type XmlRelease = { '@_version'?: string }

type XmlComponent = {
  id?: XmlNode
  '@_type'?: string
  pkgname?: XmlNode | XmlNode[]
  name?: XmlNode | XmlNode[]
  summary?: XmlNode | XmlNode[]
  icon?: XmlNode | XmlNode[]
  categories?: { category?: XmlNode | XmlNode[] }
  project_license?: XmlNode
  url?: XmlNode | XmlNode[]
  releases?: { release?: XmlRelease | XmlRelease[] }
}

type Dep11Record = {
  Type?: string
  ID?: string
  Package?: string
  ProjectLicense?: string
  Name?: Record<string, string>
  Summary?: Record<string, string>
  Description?: Record<string, string>
  Icon?: {
    cached?:
      | { name?: string; width?: number; height?: number }
      | Array<{ name?: string; width?: number; height?: number }>
  }
  Categories?: string | string[]
  Url?: Record<string, string>
  Releases?: { version?: string } | Array<{ version?: string }>
}

function text(node: XmlNode | undefined): string | null {
  if (node === undefined || node === null) return null
  const value = typeof node === 'string' ? node : node['#text']
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/** Component ID a component declares, or `null` when it declares none. */
function componentId(node: XmlNode | undefined) {
  const id = text(node)
  return id ? canonicalAppstreamId(id) : null
}

function number(value: string | number | undefined): number | null {
  if (value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Localized values are keyed by locale. AppStream catalogs use `xml:lang` (the default language has
 * no `xml:lang`), while DEP-11 uses `C` for the untranslated value; both become `en`.
 */
function localized(
  nodes: XmlNode | XmlNode[] | Record<string, string> | undefined,
): Record<string, string> {
  if (!nodes) return {}

  if (!Array.isArray(nodes) && typeof nodes === 'object' && !('#text' in nodes)) {
    const values: Record<string, string> = {}
    for (const [locale, value] of Object.entries(nodes as Record<string, string>)) {
      const trimmed = typeof value === 'string' ? value.trim() : ''
      if (trimmed) values[locale === 'C' ? 'en' : locale] = trimmed
    }
    return values
  }

  const values: Record<string, string> = {}
  for (const node of Array.isArray(nodes) ? nodes : [nodes]) {
    const value = text(node)
    if (!value) continue
    values[typeof node === 'string' ? 'en' : (node['@_xml:lang'] ?? 'en')] = value
  }
  return values
}

/** Category codes of a component, deduplicated and stripped of empty values. */
function categoryCodes(nodes: XmlNode | XmlNode[] | undefined): string[] {
  const codes = (Array.isArray(nodes) ? nodes : [nodes])
    .map((node) => text(node))
    .filter((code): code is string => Boolean(code))
  return [...new Set(codes)]
}

/** DEP-11 stores the categories as a YAML list, or as a single string for one category. */
function dep11Categories(value: string | string[] | undefined): string[] {
  if (!value) return []
  const codes = (Array.isArray(value) ? value : [value])
    .map((code) => (typeof code === 'string' ? code.trim() : ''))
    .filter((code) => code !== '')
  return [...new Set(codes)]
}

function firstUrl(nodes: XmlNode | XmlNode[] | undefined, type: string) {
  for (const node of Array.isArray(nodes) ? nodes : [nodes]) {
    if (node && typeof node !== 'string' && node['@_type'] === type) {
      const value = text(node)
      if (value) return value
    }
  }
  return null
}

export default class RepoAppstreamExtractor {
  private xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (tagName) => ['component', 'pkgname', 'icon', 'category'].includes(tagName),
  })

  private xmlBuilder = new XMLBuilder({
    attributeNamePrefix: '@_',
    format: true,
    ignoreAttributes: false,
    suppressEmptyNode: true,
  })

  /**
   * Read the AppStream metadata a repository publishes. Returns an empty list for repositories that
   * do not carry any (many third party repositories only ship packages).
   */
  async extract(repo: Repo, options: { arch?: string } = {}): Promise<ExtractedApp[]> {
    if (repo.type === 'rpm') return this.extractRpm(repo)
    if (repo.type === 'deb') return this.extractDeb(repo, options.arch ?? null)
    return []
  }

  /**
   * Read the requested icons from the repository icon archive. Icons are matched on their file name
   * and, when the archive stores several sizes in separate directories (rpm), on the declared
   * size.
   */
  async readIcons(repo: Repo, icons: AppstreamIcon[]): Promise<Map<string, Buffer>> {
    const wanted = new Map(icons.map((icon) => [iconKey(icon), icon]))
    const result = new Map<string, Buffer>()
    if (wanted.size === 0) return result

    for (const url of await this.iconArchiveUrls(repo)) {
      const archive = await this.download(url, { optional: true })
      if (!archive) continue

      const entries = readTarEntries(gunzipSync(archive))
      for (const [key, icon] of wanted) {
        if (result.has(key)) continue
        const entry = this.findIconEntry(entries, key, icon)
        if (entry) result.set(key, entry)
      }

      if (result.size === wanted.size) break
    }

    return result
  }

  private findIconEntry(
    entries: Array<{ name: string; data: Buffer }>,
    key: string,
    icon: AppstreamIcon,
  ) {
    const exact = entries.find((entry) => entry.name === key)
    if (exact) return exact.data

    const candidates = entries.filter((entry) => basename(entry.name) === icon.name)
    if (candidates.length === 0) return null

    const sized = candidates.find((entry) => entry.name.startsWith(`${icon.width}x${icon.height}/`))
    if (sized) return sized.data

    return candidates.reduce((largest, entry) =>
      entry.data.length > largest.data.length ? entry : largest,
    ).data
  }

  private async extractRpm(repo: Repo): Promise<ExtractedApp[]> {
    const hrefs = await this.repomdHrefs(repo)
    const appdata = hrefs.get('appdata')
    if (!appdata) return []

    const xml = await this.downloadText(joinUrl(repo.baseUrl, appdata), { optional: true })
    return xml ? this.parseAppstreamXml(xml) : []
  }

  /**
   * AppStream components inferred from the file list of an RPM repository. Repositories that do not
   * publish AppStream metadata still name their applications in the files their packages ship:
   * `/usr/share/metainfo/<id>.metainfo.xml` carries the AppStream ID in its file name, which is
   * enough to link the packages to an application.
   */
  async inferredComponents(repo: Repo): Promise<InferredComponent[]> {
    if (repo.type !== 'rpm') return []

    const hrefs = await this.repomdHrefs(repo)
    const filelists = hrefs.get('filelists')
    if (!filelists) return []

    const content = await this.downloadText(joinUrl(repo.baseUrl, filelists), { optional: true })
    return content ? this.parseFilelists(content) : []
  }

  /**
   * Read the AppStream metadata of an application from the metadata file its package ships.
   * Repositories that publish no AppStream catalog only carry the metadata inside the packages, so
   * the package itself is downloaded first and its payload is searched for the metadata file and,
   * when the metadata does not name a file in an icon archive, for the icon as well.
   */
  async readPackagedApp(
    pkg: ExtractedPackage,
    path: string,
    appstreamId: string,
  ): Promise<PackagedApp | null> {
    const archive = await this.download(pkg.downloadUrl)
    if (!archive) return null

    const files = await new PackageFileExtractor().readMatchingFiles(pkg.type, archive, [
      path,
      ...packagedIconPatterns,
    ])

    const content = files.get(normalizePackagePath(path))
    if (!content) return null

    const apps = this.parseAppstreamXml(content.toString('utf8'))
    const app = apps.find((entry) => isSameAppstreamId(entry.appstreamId, appstreamId)) ?? null
    if (!app) return null

    return { app, icon: await packagedIcon(files, app, appstreamId, pkg.name) }
  }

  /**
   * The file list is a flat document of every package with the files it owns. It is scanned with
   * regular expressions instead of being parsed into objects, because it is much larger than the
   * other metadata documents.
   */
  private parseFilelists(content: string): InferredComponent[] {
    const components = new Map<string, Map<string, string>>()

    for (const match of content.matchAll(/<package\b([^>]*)>([\s\S]*?)<\/package>/g)) {
      const name = /\bname="([^"]*)"/.exec(match[1])?.[1]
      if (!name) continue

      for (const file of match[2].matchAll(/<file\b[^>]*>([^<]*)<\/file>/g)) {
        const appstreamId = appstreamFileId(file[1])
        if (!appstreamId) continue

        const files = components.get(appstreamId) ?? new Map<string, string>()
        files.set(name, file[1].trim())
        components.set(appstreamId, files)
      }
    }

    return [...components].map(([appstreamId, files]) => ({
      appstreamId,
      files: [...files].map(([pkgName, path]) => ({ pkgName, path })),
    }))
  }

  private async extractDeb(repo: Repo, archOverride: string | null): Promise<ExtractedApp[]> {
    const apps = new Map<string, ExtractedApp>()

    for (const target of this.debDep11Targets(repo, archOverride)) {
      const url = `${target.directory}/Components-${target.arch}.yml.gz`
      const content = await this.downloadText(url, { optional: true })
      if (!content) continue

      for (const app of this.parseDep11(content)) {
        if (!apps.has(app.appstreamId)) apps.set(app.appstreamId, app)
      }
    }

    return [...apps.values()]
  }

  /** `dists/<suite>/<component>/dep11` directories of a deb repository, with their architecture. */
  private debDep11Targets(repo: Repo, archOverride: string | null) {
    const packages = new RepoPackageExtractor()
    const sources: ResolvedDebSource[] = packages.debSources(repo, archOverride)
    const targets: Array<{ directory: string; arch: string }> = []

    for (const source of sources) {
      if (source.suite === '.' || source.suite === './') continue
      for (const component of source.components) {
        targets.push({
          directory: joinUrl(source.uri, `dists/${source.suite}/${component}/dep11`),
          arch: source.arch,
        })
      }
    }

    return targets
  }

  private async repomdHrefs(repo: Repo) {
    const hrefs = new Map<string, string>()
    const repomd = await this.downloadText(joinUrl(repo.baseUrl, 'repodata/repomd.xml'), {
      optional: true,
    })
    if (!repomd) return hrefs

    const parsed = this.xmlParser.parse(repomd) as {
      repomd?: { data?: Array<{ '@_type'?: string; location?: { '@_href'?: string } }> }
    }
    for (const entry of parsed.repomd?.data ?? []) {
      const href = entry.location?.['@_href']
      if (entry['@_type'] && href) hrefs.set(entry['@_type'], href)
    }
    return hrefs
  }

  private async iconArchiveUrls(repo: Repo) {
    if (repo.type === 'rpm') {
      const hrefs = await this.repomdHrefs(repo)
      const href = hrefs.get('appdata-icons')
      return href ? [joinUrl(repo.baseUrl, href)] : []
    }

    const directories = this.debDep11Targets(repo, null).map((target) => target.directory)
    const urls: string[] = []
    for (const archive of debIconArchives) {
      for (const directory of directories) urls.push(`${directory}/${archive}`)
    }
    return urls
  }

  /**
   * AppStream catalogs are a single document holding every component. They are split first so that
   * a large catalog is parsed component by component instead of as one huge object.
   */
  private parseAppstreamXml(xml: string): ExtractedApp[] {
    const apps: ExtractedApp[] = []

    for (const match of xml.matchAll(/<component\b[\s\S]*?<\/component>/g)) {
      const parsed = this.xmlParser.parse(match[0]) as { component?: XmlComponent[] }
      const component = parsed.component?.[0]
      if (!component) continue

      const appstreamId = componentId(component.id)
      if (!appstreamId) continue

      const releases = component.releases?.release
      const latestRelease = Array.isArray(releases) ? releases[0] : releases
      const pkgNames = (Array.isArray(component.pkgname) ? component.pkgname : [component.pkgname])
        .map((node) => text(node))
        .filter((name): name is string => Boolean(name))

      apps.push({
        appstreamId,
        type: component['@_type'] ?? null,
        name: localized(component.name),
        summary: localized(component.summary),
        version: latestRelease?.['@_version']?.trim() || null,
        license: text(component.project_license),
        homepage: firstUrl(component.url, 'homepage'),
        categories: categoryCodes(component.categories?.category),
        pkgNames: [...new Set(pkgNames)],
        content: this.xmlBuilder.build({ component }),
        icons: this.declaredIcons(component),
      })
    }

    return apps
  }

  /**
   * Icons the component declares. A cached icon names a file in the AppStream icon archive, while a
   * stock icon names a themed icon; both are kept so that the icon can also be found inside the
   * package, which is where repositories without a catalog keep it.
   */
  private declaredIcons(component: XmlComponent): AppstreamIcon[] {
    const nodes = Array.isArray(component.icon) ? component.icon : [component.icon]
    const icons: AppstreamIcon[] = []

    for (const node of nodes) {
      if (!node || typeof node === 'string') continue
      if (node['@_type'] !== 'cached' && node['@_type'] !== 'stock') continue
      const name = text(node)
      if (!name) continue
      icons.push({
        name: node['@_type'] === 'cached' ? basename(name) : name,
        width: number(node['@_width']),
        height: number(node['@_height']),
      })
    }

    return icons.sort((a, b) => iconSize(b) - iconSize(a))
  }

  /**
   * DEP-11 documents are separated by `---`, so each component is parsed on its own.
   */
  private parseDep11(content: string): ExtractedApp[] {
    const apps: ExtractedApp[] = []

    for (const document of content.split(/\n---\n/)) {
      if (!document.includes('ID:') || document.includes('File: DEP-11')) continue

      const record = parseYaml(document) as Dep11Record | null
      if (!record?.ID) continue

      const appstreamId = canonicalAppstreamId(record.ID)
      const version = Array.isArray(record.Releases)
        ? record.Releases[0]?.version
        : record.Releases?.version

      apps.push({
        appstreamId,
        type: record.Type ?? null,
        name: localized(record.Name),
        summary: localized(record.Summary),
        version: version?.trim() || null,
        license: record.ProjectLicense?.trim() || null,
        homepage: record.Url?.homepage?.trim() || null,
        categories: dep11Categories(record.Categories),
        pkgNames: record.Package ? [record.Package] : [],
        content: this.dep11Xml(record),
        icons: this.dep11Icons(record),
      })
    }

    return apps
  }

  private dep11Icons(record: Dep11Record): AppstreamIcon[] {
    const cached = record.Icon?.cached
    const icons: AppstreamIcon[] = []

    for (const icon of Array.isArray(cached) ? cached : [cached]) {
      if (!icon?.name) continue
      icons.push({
        name: basename(icon.name),
        width: number(icon.width),
        height: number(icon.height),
      })
    }

    return icons.sort((a, b) => iconSize(b) - iconSize(a))
  }

  /**
   * The package detail page reads `appstreamContent` as AppStream XML, so the DEP-11 fields are
   * written back into that shape.
   */
  private dep11Xml(record: Dep11Record) {
    const localizedNodes = (values: Record<string, string> | undefined) => {
      const entries = Object.entries(localized(values))
      return entries.length === 0
        ? undefined
        : entries.map(([locale, value]) => ({ '#text': value, '@_xml:lang': locale }))
    }

    const categories = dep11Categories(record.Categories)

    const component: Record<string, unknown> = {
      '@_type': record.Type ?? 'desktop-application',
      id: canonicalAppstreamId(record.ID ?? ''),
      name: localizedNodes(record.Name),
      summary: localizedNodes(record.Summary),
      description: localizedNodes(record.Description),
      project_license: record.ProjectLicense,
      categories: categories.length > 0 ? { category: categories } : undefined,
      url: record.Url?.homepage
        ? { '#text': record.Url.homepage, '@_type': 'homepage' }
        : undefined,
      releases: this.dep11Version(record)
        ? { release: { '@_version': this.dep11Version(record) } }
        : undefined,
    }

    for (const [key, value] of Object.entries(component)) {
      if (value === undefined || value === null || value === '') delete component[key]
    }

    return `${this.xmlBuilder.build({ component })}\n`
  }

  private dep11Version(record: Dep11Record) {
    const releases = record.Releases
    return (Array.isArray(releases) ? releases[0]?.version : releases?.version) ?? null
  }

  private async downloadText(url: string, options: { optional?: boolean } = {}) {
    const data = await this.download(url, options)
    if (!data) return null
    if (url.endsWith('.gz')) return gunzipSync(data).toString('utf8')
    return data.toString('utf8')
  }

  private async download(
    url: string,
    options: { optional?: boolean } = {},
  ): Promise<Buffer | null> {
    try {
      const response = await xior.get<ArrayBuffer>(url, {
        responseType: 'arraybuffer',
        headers: requestHeaders,
      })
      return Buffer.from(response.data)
    } catch (error) {
      const status = isXiorError(error) ? error.response?.status : undefined
      if (options.optional && (status === 404 || status === 410)) return null
      throw new Error(`Unable to download ${url}${status ? ` (${status})` : ''}`, { cause: error })
    }
  }
}

function iconSize(icon: AppstreamIcon) {
  return Math.min(icon.width ?? 0, icon.height ?? 0)
}

/** Extensions of icons that can be stored as an image, tried when the metadata names a themed icon. */
const iconFileExtensions = ['.png', '.svg']

/** Directories a package installs its icons in, searched when the metadata names the icon file. */
const packagedIconPatterns = ['/usr/share/icons/**/apps/*', '/usr/share/pixmaps/*']

type IconCandidate = { data: Buffer; vector: boolean; pixels: number }

/**
 * Icon of a component inside the package payload. The metadata names either the icon file or a
 * themed icon, and packages also name the icon after the application, so those names are matched
 * against the icons the package installs, whether it puts them in a themed directory or in the
 * shared `/usr/share/pixmaps` one.
 */
async function packagedIcon(
  files: Map<string, Buffer>,
  app: ExtractedApp,
  appstreamId: string,
  pkgName: string,
): Promise<Buffer | null> {
  const wanted = iconBaseNames(app, appstreamId, pkgName)
  let best: IconCandidate | null = null

  for (const [path, data] of files) {
    if (!wanted.has(basename(path).toLowerCase())) continue

    const pixels = await iconPixels(data)
    if (pixels === null) continue

    const candidate = { data, vector: path.toLowerCase().endsWith('.svg'), pixels }
    if (!best || isBetterIcon(candidate, best)) best = candidate
  }

  return best?.data ?? null
}

/** Vector icons win because they scale, then the icon with more pixels, then the larger file. */
function isBetterIcon(candidate: IconCandidate, best: IconCandidate) {
  if (candidate.vector !== best.vector) return candidate.vector
  if (candidate.pixels !== best.pixels) return candidate.pixels > best.pixels
  return candidate.data.length > best.data.length
}

/**
 * Pixels an icon covers, read from the image itself. Measuring keeps the icons that carry no size
 * in their path, such as the ones in `/usr/share/pixmaps`, comparable with the icons stored in a
 * sized themed directory. Data that is not an image, a symlink for example, has no size.
 */
async function iconPixels(data: Buffer): Promise<number | null> {
  try {
    const { width, height } = await sharp(data).metadata()
    return width && height ? width * height : null
  } catch {
    return null
  }
}

/** File names the icon may have, taken from the metadata and from the application name. */
function iconBaseNames(app: ExtractedApp, appstreamId: string, pkgName: string) {
  const names = new Set<string>()
  const add = (name: string | null | undefined) => {
    const base = basename(name?.trim() ?? '').toLowerCase()
    if (!base) return

    names.add(base)
    if (iconFileExtensions.some((extension) => base.endsWith(extension))) return
    for (const extension of iconFileExtensions) names.add(`${base}${extension}`)
  }

  for (const icon of app.icons) add(icon.name)
  // An application is named either by its full AppStream ID, which is also the name of its desktop
  // file and often of its icon, or by the last segment of that ID.
  add(appstreamId)
  add(appstreamId.split('.').pop())
  add(pkgName)
  return names
}

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}
