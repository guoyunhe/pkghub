import { args, BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import chalk from 'chalk'
import { DateTime } from 'luxon'

import App from '#models/app'
import Image from '#models/image'
import Pkg from '#models/pkg'
import Repo from '#models/repo'
import RepoAppstreamExtractor, {
  desktopAppTypes,
  iconKey,
  type AppstreamIcon,
  type ExtractedApp,
} from '#services/repo_appstream_extractor'
import RepoPackageExtractor from '#services/repo_package_extractor'
import type { ExtractedPackage } from '#services/repo_package_extractor'

type PackageIdentity = Pick<ExtractedPackage, 'name' | 'version' | 'release' | 'arch'>

export default class RepoSync extends BaseCommand {
  static commandName = 'repo:sync'
  static description = 'Extract packages from configured deb/rpm repositories into the catalog'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({
    description: 'Repository name (defaults to all deb/rpm repositories)',
    required: false,
  })
  declare repoName?: string

  @flags.string({ description: 'Target architecture, e.g. x86_64 (deb repositories only)' })
  declare arch: string

  @flags.number({ description: 'Number of sample packages to print per repository', default: 5 })
  declare limit: number

  @flags.boolean({
    description: 'Synchronize repositories even when their sync interval has not elapsed',
  })
  declare force: boolean

  async run() {
    const repos = this.repoName
      ? [await Repo.findByOrFail('name', this.repoName)]
      : await Repo.query().whereIn('type', ['deb', 'rpm'])

    if (repos.length === 0) {
      this.logger.warning('No deb/rpm repositories found')
      return
    }

    const extractor = new RepoPackageExtractor()
    const appstream = new RepoAppstreamExtractor()
    let synced = 0

    for (const repo of repos) {
      const skipReason = this.syncSkipReason(repo)
      if (skipReason) {
        this.logger.info(`${repo.name}: ${chalk.dim(`skipped, ${skipReason}`)}`)
        continue
      }

      synced += 1
      this.logger.info(`Extracting packages from ${chalk.cyan(repo.name)} (${repo.type})`)
      try {
        const packages = await extractor.extract(repo, { arch: this.arch || undefined })
        const { created, updated, deleted } = await this.savePackages(repo, packages)
        const entries = await appstream.extract(repo, { arch: this.arch || undefined })
        const apps = await this.saveApps(repo, appstream, entries, packages)
        repo.lastSyncedAt = DateTime.now()
        await repo.save()
        this.logger.info(
          `${repo.name}: ${chalk.green(String(packages.length))} packages` +
            ` (${chalk.green(String(created))} created, ${chalk.yellow(String(updated))} updated,` +
            ` ${chalk.red(String(deleted))} removed)`,
        )
        if (entries.length > 0) {
          this.logger.info(
            `${repo.name}: ${chalk.green(String(entries.length))} appstream components` +
              ` (${chalk.green(String(apps.created))} apps created,` +
              ` ${chalk.yellow(String(apps.updated))} apps updated,` +
              ` ${chalk.dim(String(apps.skipped))} skipped,` +
              ` ${chalk.green(String(apps.icons))} icons,` +
              ` ${chalk.green(String(apps.linked))} packages linked)`,
          )
        }
        for (const pkg of packages.slice(0, this.limit)) {
          const details = [pkg.version, pkg.release, pkg.arch].filter(Boolean).join(' ')
          this.logger.info(`  ${pkg.name}${details ? ` ${chalk.dim(details)}` : ''}`)
        }
        if (packages.length > this.limit) {
          this.logger.info(chalk.dim(`  ... and ${packages.length - this.limit} more`))
        }
      } catch (error) {
        this.logger.error(`${repo.name}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    if (synced === 0) {
      this.logger.warning('No repositories were synchronized, use --force to sync anyway')
    }
  }

  /**
   * Returns why a repository is not synchronized, or `null` when it is. A repository that was never
   * synchronized always runs, while one without an interval is only synchronized manually once it
   * has been synchronized before, which is what `--force` does.
   */
  private syncSkipReason(repo: Repo): string | null {
    if (this.force) return null
    if (!repo.lastSyncedAt) return null
    if (repo.syncIntervalDays === null) return 'no sync interval, use --force to sync'

    const nextSync = repo.lastSyncedAt.plus({ days: repo.syncIntervalDays })
    if (nextSync <= DateTime.now()) return null
    return `next sync at ${nextSync.toFormat('yyyy-MM-dd HH:mm')}, use --force to sync now`
  }

  /**
   * Write the extracted packages to the database. Packages are keyed by repository, name, version,
   * release and architecture, so synchronizing the same repository again updates the existing rows
   * instead of inserting duplicates. Packages that are no longer in the repository are removed,
   * unless the repository returned nothing at all, which is more likely a metadata problem than an
   * emptied repository. Repository packages are not tied to a catalog application.
   */
  private async savePackages(repo: Repo, packages: ExtractedPackage[]) {
    const existing = await Pkg.query().where('repoId', repo.id)
    const known = new Map(existing.map((pkg) => [this.packageKey(pkg), pkg]))
    const stale = new Map(known)
    let created = 0
    let updated = 0
    let deleted = 0

    for (const item of packages) {
      const key = this.packageKey(item)
      stale.delete(key)

      let pkg = known.get(key)
      if (pkg) {
        updated += 1
      } else {
        pkg = new Pkg()
        known.set(key, pkg)
        created += 1
      }

      pkg.merge({
        repoId: repo.id,
        type: item.type,
        name: item.name,
        version: item.version,
        release: item.release,
        arch: item.arch,
        license: item.license,
        summary: item.summary,
        description: item.description,
        downloadUrl: item.downloadUrl,
        checksum: item.checksum,
        checksumType: item.checksumType,
        size: item.size,
        installCommand:
          item.type === 'deb' ? `apt install ${item.name}` : `dnf install ${item.name}`,
      })
      await pkg.save()
    }

    if (packages.length === 0) {
      if (stale.size > 0) {
        this.logger.warning(
          `${repo.name}: no packages were extracted, keeping the ${stale.size} stored package(s)`,
        )
      }
    } else {
      for (const pkg of stale.values()) {
        await pkg.delete()
        deleted += 1
      }
    }

    return { created, updated, deleted }
  }

  private packageKey(pkg: PackageIdentity) {
    return [pkg.name, pkg.version, pkg.release, pkg.arch].map((value) => value ?? '').join('\u0000')
  }

  /**
   * Create or update the applications a repository publishes, store the largest of their icons and
   * link the packages they belong to. An application that declares its own `appstreamUrl` keeps
   * that metadata, and only components that name a package of the repository are imported.
   */
  private async saveApps(
    repo: Repo,
    appstream: RepoAppstreamExtractor,
    entries: ExtractedApp[],
    packages: ExtractedPackage[],
  ) {
    const result = { created: 0, updated: 0, skipped: 0, icons: 0, linked: 0 }
    const pkgNames = new Set(packages.map((pkg) => pkg.name))
    const candidates = entries.filter(
      (entry) =>
        entry.type !== null &&
        desktopAppTypes.includes(entry.type) &&
        Object.keys(entry.name).length > 0 &&
        Object.keys(entry.summary).length > 0 &&
        entry.pkgNames.some((name) => pkgNames.has(name)),
    )
    if (candidates.length === 0) return result

    const known = new Map((await App.query().preload('icon')).map((app) => [app.appstreamId, app]))
    const pendingIcons: Array<{ app: App; icon: AppstreamIcon }> = []

    for (const entry of candidates) {
      const current = known.get(entry.appstreamId)
      // Applications with their own AppStream URL are not overwritten by repository metadata
      if (current?.appstreamUrl) {
        result.skipped += 1
        continue
      }

      const app = current ?? new App()
      app.merge({
        appstreamId: entry.appstreamId,
        name: entry.name,
        summary: entry.summary,
        version: entry.version,
        license: entry.license,
        homepage: entry.homepage,
        appstreamContent: entry.content,
      })
      await app.save()
      if (current) result.updated += 1
      else result.created += 1

      const icon = entry.icons[0]
      if (icon && appstreamIconIsLarger(app, icon)) pendingIcons.push({ app, icon })

      const names = entry.pkgNames.filter((name) => pkgNames.has(name))
      if (names.length > 0) {
        await Pkg.query().where('repoId', repo.id).whereIn('name', names).update({ appId: app.id })
        result.linked += names.length
      }
    }

    if (pendingIcons.length > 0) {
      const buffers = await appstream.readIcons(
        repo,
        pendingIcons.map((item) => item.icon),
      )
      for (const { app, icon } of pendingIcons) {
        const data = buffers.get(iconKey(icon))
        if (!data) continue

        const image = await Image.createFromBuffer(data)
        app.iconId = image.id
        await app.save()
        result.icons += 1
      }
    }

    return result
  }
}

/**
 * A repository icon is only stored when it is larger than the icon an application already has, so
 * that synchronizing a repository does not downgrade curated artwork.
 */
function appstreamIconIsLarger(app: App, icon: AppstreamIcon) {
  const size = Math.min(icon.width ?? 0, icon.height ?? 0)
  if (size <= 0) return false
  if (!app.icon) return true
  return size > Math.min(app.icon.width, app.icon.height)
}
