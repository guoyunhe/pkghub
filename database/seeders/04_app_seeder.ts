import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { XMLParser } from 'fast-xml-parser'
import xior, { isXiorError } from 'xior'

import App from '#models/app'
import Image from '#models/image'
import Pkg from '#models/pkg'

const applications = [
  {
    appstreamUrl:
      'https://raw.githubusercontent.com/libretro/RetroArch/refs/heads/master/com.libretro.RetroArch.metainfo.xml',
    desktopUrl:
      'https://raw.githubusercontent.com/libretro/RetroArch/refs/heads/master/com.libretro.RetroArch.desktop',
    iconUrl:
      'https://raw.githubusercontent.com/libretro/RetroArch/refs/heads/master/media/com.libretro.RetroArch.svg',
    packages: [
      {
        arch: 'x86_64',
        downloadUrl: 'https://buildbot.libretro.com/stable/1.22.2/linux/x86_64/RetroArch.7z',
        version: '1.22.2',
      },
      {
        arch: 'x86_64',
        downloadUrl: 'https://buildbot.libretro.com/nightly/linux/x86_64/RetroArch.7z',
        version: 'nightly',
      },
    ],
  },
  {
    appstreamUrl:
      'https://raw.githubusercontent.com/keepassxreboot/keepassxc/develop/share/linux/org.keepassxc.KeePassXC.appdata.xml',
    iconUrl:
      'https://raw.githubusercontent.com/keepassxreboot/keepassxc/develop/share/branding/scalable/keepassxc.svg',
  },
  {
    appstreamUrl:
      'https://git.eden-emu.dev/eden-emu/eden/raw/branch/master/dist/dev.eden_emu.eden.metainfo.xml',
    desktopUrl:
      'https://git.eden-emu.dev/eden-emu/eden/raw/branch/master/dist/dev.eden_emu.eden.desktop',
    iconUrl:
      'https://git.eden-emu.dev/eden-emu/eden/raw/commit/20f9aa4cfecf6b17735e0c8d7faa21e5d9388cfd/dist/dev.eden_emu.eden.svg',
  },
]

type XmlNode = string | { '#text'?: string; '@_xml:lang'?: string }
type AppStreamComponent = {
  id?: XmlNode
  name?: XmlNode | XmlNode[]
  summary?: XmlNode | XmlNode[]
  project_license?: XmlNode
  releases?: { release?: { '@_version'?: string } | Array<{ '@_version'?: string }> }
}

const parser = new XMLParser({
  ignoreAttributes: false,
  isArray: (tagName) => ['name', 'summary', 'release'].includes(tagName),
})
const requestHeaders = { Accept: '*/*', 'User-Agent': 'curl/8.0' }

function text(node: XmlNode | undefined) {
  return typeof node === 'string' ? node.trim() : node?.['#text']?.trim()
}

function localizations(nodes: XmlNode | XmlNode[] | undefined) {
  const values: Record<string, string> = {}
  for (const node of Array.isArray(nodes) ? nodes : [nodes]) {
    if (!node) continue
    const value = text(node)
    if (!value) continue
    values[typeof node === 'string' ? 'en' : (node['@_xml:lang'] ?? 'en')] = value
  }
  return values
}

function parseAppStream(xml: string) {
  const { component } = parser.parse(xml) as { component?: AppStreamComponent }
  const appstreamId = text(component?.id)
  const name = localizations(component?.name)
  const summary = localizations(component?.summary)
  const releases = component?.releases?.release
  const latestRelease = Array.isArray(releases) ? releases[0] : releases

  if (!appstreamId || !name.en || !summary.en) {
    throw new Error('AppStream XML must contain an id, English name, and English summary')
  }

  return {
    appstreamId,
    name: JSON.stringify(name),
    summary: JSON.stringify(summary),
    version: latestRelease?.['@_version'] ?? null,
    license: text(component?.project_license) ?? null,
  }
}

export default class AppSeeder extends BaseSeeder {
  async run() {
    for (const { appstreamUrl, desktopUrl, iconUrl, packages = [] } of applications) {
      const appstreamData = await this.download(appstreamUrl, 'AppStream XML')
      const appstreamXml = appstreamData.toString('utf8')
      const application = parseAppStream(appstreamXml)
      const desktop = desktopUrl ? await this.downloadDesktop(desktopUrl) : null

      const app = await App.updateOrCreate(
        { appstreamId: application.appstreamId },
        { ...application, appstreamUrl, appstreamXml, desktopUrl: desktopUrl ?? null, desktop },
      )
      await this.updateIcon(app, iconUrl)
      await this.updatePackages(app, packages)
    }
  }

  private async updatePackages(
    app: App,
    packages: Array<{ arch: string; downloadUrl: string; version: string }>,
  ) {
    for (const pkg of packages) {
      await Pkg.updateOrCreate(
        { appId: app.id, type: 'appimage', version: pkg.version, arch: pkg.arch },
        {
          ...pkg,
          appId: app.id,
          type: 'appimage',
          name: 'RetroArch',
          release: null,
          repoId: null,
          checksum: null,
          checksumType: null,
          size: null,
          installCommand: '7z x RetroArch.7z && chmod +x RetroArch*.AppImage',
        },
      )
    }
  }

  private async downloadDesktop(desktopUrl: string) {
    const desktop = await this.download(desktopUrl, 'desktop file')
    return desktop.toString('utf8')
  }

  private async updateIcon(app: App, iconUrl: string) {
    const icon = app.iconId ? await Image.find(app.iconId) : null
    const options = {
      acceptedFormats: ['svg', 'png'] as const,
      minimumPngSize: 512,
    }
    const image = icon
      ? await Image.replaceFromUrl(icon, iconUrl, options)
      : await Image.createFromUrl(iconUrl, options)

    if (app.iconId !== image.id) {
      await app.merge({ iconId: image.id }).save()
    }
  }

  private download(url: string, resource: string) {
    return xior
      .get<ArrayBuffer>(url, { responseType: 'arraybuffer', headers: requestHeaders })
      .then((response) => Buffer.from(response.data))
      .catch((error: unknown) => {
        const status = isXiorError(error) ? error.response?.status : undefined
        throw new Error(`Unable to download ${resource}: ${url}${status ? ` (${status})` : ''}`, {
          cause: error,
        })
      })
  }
}
