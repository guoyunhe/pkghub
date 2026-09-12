import { compare, valid } from 'semver'

/**
 * Version helpers shared by the repository synchronization command and any other place that has to
 * decide whether one release is newer than another.
 */

type VersionPart = { numeric: true; value: number } | { numeric: false; value: string }

function versionParts(version: string): VersionPart[] {
  return Array.from(version.matchAll(/(\d+)|([a-z]+)/gi), (match) =>
    match[1] === undefined
      ? ({ numeric: false, value: match[2]!.toLowerCase() } as const)
      : ({ numeric: true, value: Number.parseInt(match[1], 10) } as const),
  )
}

/**
 * Comparison used for versions semver cannot parse, such as `1.0.0.87` (too many segments) or
 * `1.10` (incomplete): numeric chunks are compared as numbers and everything else, like the `git`
 * of `4.4.8.git.160`, as text.
 */
function compareParts(a: string, b: string): number {
  const left = versionParts(a)
  const right = versionParts(b)
  const missing: VersionPart = { numeric: true, value: 0 }

  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const x = left[index] ?? missing
    const y = right[index] ?? missing

    if (x.numeric && y.numeric) {
      if (x.value !== y.value) return x.value - y.value
    } else {
      const xs = String(x.value)
      const ys = String(y.value)
      if (xs !== ys) return xs < ys ? -1 : 1
    }
  }

  return 0
}

/**
 * Compare two version strings, returning a negative number when `a` is older than `b`, `0` when
 * both describe the same version and a positive number when `a` is newer.
 *
 * Both sides are parsed with `semver` when they follow semantic versioning, so the pre-release
 * `2.0.0-rc.1` sorts below the release `2.0.0`. Repository metadata is not required to follow
 * semantic versioning though, so versions that `semver` rejects, like the `1.0.0.87` of a Steam
 * release or the leading zeros of `2024.02`, fall back to a chunk comparison where `1.2` equals
 * `1.2.0` and `1.0.0.87` is newer than `1.0.0.80`.
 */
export function compareVersions(a: string, b: string): number {
  const left = valid(a, { loose: true })
  const right = valid(b, { loose: true })
  if (left !== null && right !== null) return compare(left, right)
  return compareParts(a, b)
}
