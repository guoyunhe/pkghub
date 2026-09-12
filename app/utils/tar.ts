/**
 * Minimal reader for the tar archives found next to package metadata (deb control archives,
 * AppStream icon archives). Long names are supported through the GNU `L` header, which is what apt
 * and createrepo write for deeply nested entries.
 */
export type TarEntry = {
  name: string
  data: Buffer
}

function readTarString(header: Buffer, offset: number, length: number) {
  const value = header.subarray(offset, offset + length)
  const end = value.indexOf(0)
  return value
    .subarray(0, end === -1 ? value.length : end)
    .toString('utf8')
    .trim()
}

export function readTarEntries(data: Buffer): TarEntry[] {
  const entries: TarEntry[] = []
  let offset = 0
  let longName: string | null = null

  while (offset + 512 <= data.length) {
    const header = data.subarray(offset, offset + 512)
    if (header.every((byte) => byte === 0)) break

    const size = Number.parseInt(readTarString(header, 124, 12) || '0', 8)
    const typeFlag = String.fromCharCode(header[156] ?? 0)
    const prefix = readTarString(header, 345, 155)
    let name = readTarString(header, 0, 100)
    if (prefix) name = `${prefix}/${name}`

    offset += 512
    const contents = data.subarray(offset, offset + Math.max(size, 0))
    offset += Math.ceil(Math.max(size, 0) / 512) * 512

    if (typeFlag === 'L') {
      longName = contents.toString('utf8').replace(/\0+$/, '')
      continue
    }

    const entryName = (longName ?? name).replace(/^\.\/+/, '')
    longName = null
    if (typeFlag === '0' || typeFlag === '\0' || !typeFlag) {
      entries.push({ name: entryName, data: contents })
    }
  }

  return entries
}
