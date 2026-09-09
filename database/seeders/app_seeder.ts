import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { XMLParser } from 'fast-xml-parser'

import App from '#models/app'

const appstreamUrls = [
  'https://raw.githubusercontent.com/libretro/RetroArch/refs/heads/master/com.libretro.RetroArch.metainfo.xml',
  'https://raw.githubusercontent.com/keepassxreboot/keepassxc/develop/share/linux/org.keepassxc.KeePassXC.appdata.xml',
  'https://git.eden-emu.dev/eden-emu/eden/raw/branch/master/dist/dev.eden_emu.eden.metainfo.xml',
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
    for (const appstreamUrl of appstreamUrls) {
      const response = await fetch(appstreamUrl)
      if (!response.ok) {
        throw new Error(`Unable to download AppStream XML: ${appstreamUrl} (${response.status})`)
      }

      const appstreamXml = await response.text()
      const application = parseAppStream(appstreamXml)

      await App.updateOrCreate(
        { appstreamId: application.appstreamId },
        { ...application, appstreamUrl, appstreamXml, desktop: null },
      )
    }
  }
}
