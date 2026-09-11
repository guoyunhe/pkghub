import vine from '@vinejs/vine'

type LocalizedText = Record<string, string>

/**
 * HTML forms send empty strings for unset values and JSON clients may omit the key entirely. Both
 * are normalized to null.
 */
const emptyToNull = (value: unknown) => (value === '' || value === undefined ? null : value)

/**
 * Localized text is a JSON object of locale => text. The "en" translation is required, while blank
 * and non-string translations are dropped.
 */
const localizedTextRule = vine.createRule((value, _options, field) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return

  const localized: LocalizedText = {}
  for (const [locale, text] of Object.entries(value as Record<string, unknown>)) {
    if (typeof text !== 'string') continue

    const trimmed = text.trim()
    if (locale && trimmed) localized[locale] = trimmed
  }

  if (!localized.en) {
    field.report('The {{ field }} field must have an "en" translation', 'localizedText', field)
    return
  }

  field.mutate(localized, field)
})

const localizedText = () => vine.record(vine.string()).use(localizedTextRule())

/**
 * Validator to use when creating or updating an app. The `appId` meta value excludes the app being
 * updated from the unique AppStream identifier check.
 */
export const appValidator = vine.create({
  name: localizedText(),
  summary: localizedText(),
  version: vine.string().parse(emptyToNull).trim().maxLength(255).nullable(),
  license: vine.string().parse(emptyToNull).trim().maxLength(255).nullable(),
  appstreamId: vine
    .string()
    .parse(emptyToNull)
    .trim()
    .maxLength(255)
    .unique({
      table: 'apps',
      column: 'appstream_id',
      filter: (db, _value, field) => {
        const appId = (field.meta as { appId?: number }).appId
        if (appId) db.whereNot('id', appId)
      },
    })
    .nullable(),
  appstreamUrl: vine.string().parse(emptyToNull).trim().maxLength(255).nullable(),
  appstreamContent: vine.string().parse(emptyToNull).trim().nullable(),
  desktopUrl: vine.string().parse(emptyToNull).trim().maxLength(255).nullable(),
  desktopContent: vine.string().parse(emptyToNull).trim().nullable(),
  iconId: vine.number().parse(emptyToNull).exists({ table: 'images', column: 'id' }).nullable(),
})
