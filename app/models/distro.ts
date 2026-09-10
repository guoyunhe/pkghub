import { DateTime } from 'luxon'

import { DistroSchema } from '#database/schema'

type OsReleaseValues = Record<string, string>

function parseOsRelease(contents: string): OsReleaseValues {
  return Object.fromEntries(
    contents
      .split('\n')
      .map((line) => line.match(/^([A-Z0-9_]+)=(.*)$/))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map(([_, key, rawValue]) => [key, rawValue.replace(/^(?:"|')|(?:"|')$/g, '')]),
  )
}

function isRollingRelease(values: OsReleaseValues) {
  const identifier = `${values.ID ?? ''} ${values.NAME ?? ''}`.toLowerCase()
  return identifier.includes('rolling') || identifier.includes('tumbleweed')
}

function parseDate(value: string | undefined) {
  if (!value) return null

  const date = DateTime.fromISO(value)
  return date.isValid ? date : null
}

export default class Distro extends DistroSchema {
  static fromOsRelease(contents: string) {
    const values = parseOsRelease(contents)

    if (!values.NAME) throw new Error('The os-release file does not define NAME')

    return {
      name: values.NAME,
      version: isRollingRelease(values) ? null : (values.VERSION_ID ?? null),
      releaseDate: parseDate(values.RELEASE_DATE),
      eolDate: parseDate(values.EOL_DATE),
    }
  }
}
