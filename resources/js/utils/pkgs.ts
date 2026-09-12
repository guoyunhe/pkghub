import type { Data } from '@generated/data'

/**
 * Link behind the download button: the URL configured for the package (repository packages and
 * manually created entries), falling back to the file uploaded to this server.
 */
export function pkgDownloadUrl(pkg: Data.Pkg) {
  return pkg.downloadUrl ?? pkg.url
}
