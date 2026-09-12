/**
 * Helpers shared by the Debian repository index parser (`repo_package_extractor`) and the uploaded
 * package file extractor (`package_file_extractor`).
 */

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const trimmed = String(value).trim()
  return trimmed ? trimmed : null
}

/**
 * Debian versions look like `[epoch:]upstream[-revision]`. The epoch is dropped and the trailing
 * revision, when present, is returned separately.
 */
export function splitDebVersion(value: string | undefined): {
  version: string | null
  release: string | null
} {
  const upstream = text(value)
  if (!upstream) return { version: null, release: null }
  const withoutEpoch = upstream.includes(':') ? upstream.slice(upstream.indexOf(':') + 1) : upstream
  const dash = withoutEpoch.lastIndexOf('-')
  return dash === -1
    ? { version: withoutEpoch, release: null }
    : {
        version: withoutEpoch.slice(0, dash),
        release: withoutEpoch.slice(dash + 1),
      }
}

/**
 * Deb packages describe themselves with a single multi-line `Description`: the first line is the
 * short summary and the remaining lines form the long description.
 */
export function splitDebDescription(value: string | undefined): {
  summary: string | null
  description: string | null
} {
  const full = text(value)
  if (!full) return { summary: null, description: null }
  const newline = full.indexOf('\n')
  if (newline === -1) return { summary: full, description: null }
  return {
    summary: text(full.slice(0, newline)),
    description: text(full.slice(newline + 1)),
  }
}
