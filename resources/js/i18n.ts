import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'
import zhTW from './locales/zh-TW.json'

/**
 * Collapses any detected Chinese tag (`zh`, `zh-Hans-CN`, `zh-Hant-HK`, …) onto one of the two
 * supported Chinese locales. Traditional scripts and the TW/HK/MO regions map to `zh-TW`.
 */
export function normalizeLanguage(language: string) {
  const tag = language.toLowerCase()
  if (!tag.startsWith('zh')) {
    return tag
  }
  return /(hant|[-_]tw|[-_]hk|[-_]mo)/.test(tag) ? 'zh-TW' : 'zh-CN'
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      'zh-CN': { translation: zhCN },
      'zh-TW': { translation: zhTW },
    },
    supportedLngs: ['en', 'zh-CN', 'zh-TW'],
    load: 'currentOnly',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],
      convertDetectedLanguage: normalizeLanguage,
    },
  })
  .then(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? 'en'
  })

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language
})

export default i18n
