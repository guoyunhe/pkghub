/**
 * Language tags commonly used by AppStream metadata. The list only provides suggestions: any tag
 * stored in the database is offered as well, so translations of any language stay editable.
 */
export const commonLanguages = [
  'en',
  'zh-CN',
  'zh-TW',
  'zh',
  'ja',
  'ko',
  'de',
  'fr',
  'es',
  'pt',
  'pt-BR',
  'it',
  'ru',
  'uk',
  'pl',
  'nl',
  'sv',
  'da',
  'nb',
  'nn',
  'fi',
  'is',
  'cs',
  'sk',
  'sl',
  'hr',
  'bs',
  'sr',
  'mk',
  'bg',
  'ro',
  'hu',
  'el',
  'tr',
  'az',
  'hy',
  'ka',
  'he',
  'ar',
  'fa',
  'ur',
  'hi',
  'bn',
  'pa',
  'gu',
  'mr',
  'ta',
  'te',
  'kn',
  'ml',
  'si',
  'ne',
  'th',
  'lo',
  'km',
  'my',
  'vi',
  'id',
  'ms',
  'tl',
  'sw',
  'am',
  'af',
  'sq',
  'be',
  'ca',
  'cy',
  'et',
  'eu',
  'ga',
  'gl',
  'kk',
  'ky',
  'lt',
  'lv',
  'mn',
  'uz',
  'tg',
  'eo',
]

/** Language used when the requested locale has no translation at all. */
export const fallbackLanguage = commonLanguages[0]

/**
 * Script implied by a language tag, keyed by base language then region (with `*` as the fallback
 * for tags without a region). Kept as data so language matching stays generic.
 */
const scriptHints: Record<string, Record<string, string>> = {
  zh: { '*': 'hans', cn: 'hans', hk: 'hant', mo: 'hant', my: 'hans', sg: 'hans', tw: 'hant' },
}

/** Script implied by a base language and optional region, if any. */
export function scriptForRegion(base: string, region: string | undefined) {
  const hints = scriptHints[base]
  if (!hints) return undefined
  return region ? (hints[region] ?? hints['*']) : hints['*']
}

/** Human readable name of a language tag, shown in the language of the interface. */
export function languageLabel(tag: string, uiLanguage: string) {
  try {
    return new Intl.DisplayNames([uiLanguage], { type: 'language' }).of(tag) ?? tag
  } catch {
    return tag
  }
}

export type LanguageOption = {
  label: string
  value: string
}

function dedupe(tags: string[]) {
  const seen = new Set<string>()
  const result: string[] = []
  for (const tag of tags) {
    const value = tag.trim()
    if (!value || seen.has(value.toLowerCase())) continue
    seen.add(value.toLowerCase())
    result.push(value)
  }
  return result
}

/**
 * Language tags offered by a form: the ones already present in the data first, then the common
 * suggestions. The label carries the tag itself so the list can be searched by code.
 */
export function languageOptions(used: string[], uiLanguage: string): LanguageOption[] {
  return dedupe([...used, ...commonLanguages]).map((value) => ({
    value,
    label: `${languageLabel(value, uiLanguage)} (${value})`,
  }))
}

/** Picks the language a form starts with: the data's own language, else the interface language. */
export function defaultLanguage(used: string[], uiLanguage?: string) {
  const pool = dedupe([...used, ...commonLanguages])
  const wanted = uiLanguage?.toLowerCase()
  const exact = wanted ? pool.find((tag) => tag.toLowerCase() === wanted) : undefined
  const base = wanted?.split('-')[0]
  const interfaceLanguage = base ? pool.find((tag) => tag.toLowerCase() === base) : undefined
  return used[0] ?? exact ?? interfaceLanguage ?? fallbackLanguage
}
