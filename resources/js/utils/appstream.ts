export type LocalizedText = Record<string, string>

export type AppStreamScreenshot = {
  caption: LocalizedText | null
  height: number | null
  language: string | null
  url: string
  width: number | null
}

/**
 * AppStream allows a description to be translated, so blocks are grouped by their `xml:lang`.
 * Blocks without a language belong to the component's default (untranslated) language.
 */
export type AppStreamDescription = {
  default: string[]
  translations: Record<string, string[]>
}

export type AppStreamInfo = {
  description: AppStreamDescription
  screenshots: AppStreamScreenshot[]
}

/** Elements allowed inside a description, with the attributes allowed on each of them. */
const allowedElements: Record<string, string[]> = {
  a: ['href', 'title'],
  b: [],
  blockquote: [],
  br: [],
  code: [],
  div: [],
  em: [],
  i: [],
  img: ['alt', 'height', 'src', 'width'],
  li: [],
  ol: [],
  p: [],
  pre: [],
  span: [],
  strong: [],
  ul: [],
}

/** Elements that are dropped together with their content. */
const droppedElements = new Set([
  'embed',
  'head',
  'iframe',
  'math',
  'noscript',
  'object',
  'script',
  'style',
  'svg',
  'template',
  'title',
])

function attr(element: Element, name: string) {
  const value = element.getAttribute(name)?.trim()
  return value || null
}

function language(element: Element) {
  return attr(element, 'xml:lang')?.toLowerCase() ?? null
}

function size(element: Element, name: string) {
  const value = Number.parseInt(attr(element, name) ?? '', 10)
  return Number.isFinite(value) && value > 0 ? value : null
}

function safeUrl(value: string | null) {
  return value && /^https?:\/\//i.test(value) ? value : null
}

function childElement(parent: Element, tag: string) {
  return Array.from(parent.children).find((child) => child.tagName.toLowerCase() === tag)
}

function cleanNode(node: Node, document: Document): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.nodeValue ?? '')
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null
  }

  const element = node as Element
  const tag = element.tagName.toLowerCase()
  const attributes = allowedElements[tag]

  if (!attributes) {
    if (droppedElements.has(tag)) {
      return null
    }
    // Unknown wrappers are dropped, but their text content is kept.
    const fragment = document.createDocumentFragment()
    for (const child of Array.from(element.childNodes)) {
      const cleaned = cleanNode(child, document)
      if (cleaned) fragment.append(cleaned)
    }
    return fragment
  }

  const clone = document.createElement(tag)
  for (const { name, value } of Array.from(element.attributes)) {
    const key = name.toLowerCase()
    if (!attributes.includes(key)) continue
    const safe = key === 'href' || key === 'src' ? safeUrl(value.trim()) : value
    if (safe) clone.setAttribute(key, safe)
  }
  if (tag === 'a' && clone.hasAttribute('href')) {
    clone.setAttribute('rel', 'noreferrer')
    clone.setAttribute('target', '_blank')
  }
  for (const child of Array.from(element.childNodes)) {
    const cleaned = cleanNode(child, document)
    if (cleaned) clone.append(cleaned)
  }
  return clone
}

/** Strips every tag and attribute that AppStream does not allow, so the result is safe to render. */
export function sanitizeDescription(html: string) {
  if (!html) {
    return ''
  }
  const document = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  const container = document.createElement('div')
  for (const child of Array.from(document.body.childNodes)) {
    const cleaned = cleanNode(child, document)
    if (cleaned) container.append(cleaned)
  }
  return container.innerHTML.trim()
}

function parseDescription(component: Element): AppStreamDescription {
  const result: AppStreamDescription = { default: [], translations: {} }
  const description = childElement(component, 'description')
  if (!description) {
    return result
  }

  for (const child of Array.from(description.children)) {
    // Legacy AppStream versions nested screenshots inside the description.
    if (child.tagName.toLowerCase() === 'screenshot') continue
    const html = sanitizeDescription(child.outerHTML)
    if (!html) continue
    const code = language(child)
    if (code) {
      const blocks = result.translations[code] ?? (result.translations[code] = [])
      blocks.push(html)
    } else {
      result.default.push(html)
    }
  }

  // Untranslated descriptions may hold plain text instead of block elements.
  if (result.default.length === 0 && Object.keys(result.translations).length === 0) {
    const html = sanitizeDescription(description.innerHTML)
    if (html) {
      result.default.push(html)
    }
  }

  return result
}

function parseCaption(screenshot: Element): LocalizedText | null {
  const caption: LocalizedText = {}
  for (const child of Array.from(screenshot.children)) {
    if (child.tagName.toLowerCase() !== 'caption') continue
    const text = child.textContent?.trim()
    if (!text) continue
    caption[language(child) ?? 'en'] = text
  }
  return Object.keys(caption).length > 0 ? caption : null
}

function parseImage(screenshot: Element) {
  const images = Array.from(screenshot.children).filter(
    (child) => child.tagName.toLowerCase() === 'image',
  )
  const image = images.find((child) => (attr(child, 'type') ?? 'source') === 'source') ?? images[0]
  const url = safeUrl(image?.textContent?.trim() ?? null)
  if (!image || !url) {
    return null
  }
  return { url, width: size(image, 'width'), height: size(image, 'height') }
}

function parseScreenshots(component: Element) {
  const screenshots: AppStreamScreenshot[] = []
  const seen = new Set<string>()
  const nodes = [
    ...Array.from(component.querySelectorAll('screenshots > screenshot')),
    ...Array.from(component.querySelectorAll('description > screenshot')),
  ]

  for (const node of nodes) {
    const image = parseImage(node)
    if (!image || seen.has(image.url)) continue
    seen.add(image.url)
    screenshots.push({ ...image, caption: parseCaption(node), language: language(node) })
  }

  return screenshots
}

/** Parses an AppStream component document into the data the detail page displays. */
export function parseAppStreamContent(content: string | null | undefined): AppStreamInfo {
  const empty: AppStreamInfo = { description: { default: [], translations: {} }, screenshots: [] }
  if (!content?.trim()) {
    return empty
  }

  const document = new DOMParser().parseFromString(content, 'application/xml')
  if (document.querySelector('parsererror')) {
    return empty
  }
  const component = document.querySelector('component') ?? document.documentElement
  if (!component) {
    return empty
  }

  return { description: parseDescription(component), screenshots: parseScreenshots(component) }
}

const chineseTraditionalRegions = new Set(['hk', 'mo', 'tw'])

/**
 * Splits a language tag such as `zh-Hans-CN` into its base language and script. Chinese is often
 * published as `zh-Hans` / `zh-Hant` or as a region (`zh-TW`), and a bare `zh` tag is treated as
 * Simplified Chinese, which is what this site uses for its own Chinese locale.
 */
function languageParts(tag: string) {
  const subtags = tag.toLowerCase().split(/[-_]/).filter(Boolean)
  const base = subtags[0] ?? ''
  let script = subtags.find((subtag, index) => index > 0 && subtag.length === 4)
  if (base === 'zh' && !script) {
    const region = subtags.find((subtag, index) => index > 0 && subtag.length <= 3)
    script = region && chineseTraditionalRegions.has(region) ? 'hant' : 'hans'
  }
  return { base, script }
}

/** Scores how well a translation tag matches the requested locale: 2 exact-ish, 1 loose, 0 no match. */
function languageScore(tag: string, language: string) {
  const wanted = languageParts(language)
  const candidate = languageParts(tag)
  if (!candidate.base || candidate.base !== wanted.base) {
    return 0
  }
  if (candidate.script && wanted.script) {
    return candidate.script === wanted.script ? 2 : 1
  }
  return 2
}

/** Returns the translation tag that matches the locale best, or `undefined` when nothing matches. */
function bestLanguageKey(keys: string[], language: string) {
  let best: { key: string; score: number } | undefined
  for (const key of keys) {
    const score = languageScore(key, language)
    if (score > 0 && (!best || score > best.score)) {
      best = { key, score }
    }
  }
  return best?.key
}

function englishKey(keys: string[]) {
  return keys.find((key) => key.toLowerCase() === 'en')
}

/** Picks the value matching the locale, falling back to English, then to any value. */
export function localized(translations: LocalizedText | null | undefined, language: string) {
  if (!translations) {
    return undefined
  }
  const keys = Object.keys(translations)
  const key = bestLanguageKey(keys, language) ?? englishKey(keys)
  return key ? translations[key] : Object.values(translations)[0]
}

function descriptionBlocks(description: AppStreamDescription, language: string) {
  const keys = Object.keys(description.translations)
  const key = bestLanguageKey(keys, language)
  const english = englishKey(keys)
  return (
    (key ? description.translations[key] : undefined) ??
    (description.default.length > 0 ? description.default : undefined) ??
    (english ? description.translations[english] : undefined) ??
    Object.values(description.translations)[0] ??
    []
  )
}

/** Returns the description HTML in the requested language, or an empty string. */
export function resolveDescription(description: AppStreamDescription, language: string) {
  return descriptionBlocks(description, language).join('\n')
}

/**
 * Keeps the screenshots translated to the requested language (plus the untranslated ones), falling
 * back to English, then to every screenshot when no translation matches.
 */
export function selectScreenshots(screenshots: AppStreamScreenshot[], language: string) {
  if (screenshots.length === 0) {
    return screenshots
  }

  let best = 0
  const scores = new Map<AppStreamScreenshot, number>()
  for (const screenshot of screenshots) {
    const score = screenshot.language ? languageScore(screenshot.language, language) : 0
    scores.set(screenshot, score)
    if (score > best) best = score
  }

  if (best > 0) {
    return screenshots.filter(
      (screenshot) => !screenshot.language || scores.get(screenshot) === best,
    )
  }

  const english = screenshots.filter(
    (screenshot) => screenshot.language && languageScore(screenshot.language, 'en') > 0,
  )
  return english.length > 0 ? english : screenshots
}
