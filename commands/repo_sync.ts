import { args, BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import chalk from 'chalk'
import { DateTime } from 'luxon'

import Pkg from '#models/pkg'
import Repo from '#models/repo'
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

  async run() {
    const repos = this.repoName
      ? [await Repo.findByOrFail('name', this.repoName)]
      : await Repo.query().whereIn('type', ['deb', 'rpm'])

    if (repos.length === 0) {
      this.logger.warning('No deb/rpm repositories found')
      return
    }

    const extractor = new RepoPackageExtractor()

    for (const repo of repos) {
      this.logger.info(`Extracting packages from ${chalk.cyan(repo.name)} (${repo.type})`)
      try {
        const packages = await extractor.extract(repo, { arch: this.arch || undefined })
        const { created, updated } = await this.savePackages(repo, packages)
        repo.lastSyncedAt = DateTime.now()
        await repo.save()
        this.logger.info(
          `${repo.name}: ${chalk.green(String(packages.length))} packages` +
            ` (${chalk.green(String(created))} created, ${chalk.yellow(String(updated))} updated)`,
        )
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
  }

  /**
   * Write the extracted packages to the database. Packages are keyed by repository, name, version,
   * release and architecture, so synchronizing the same repository again updates the existing rows
   * instead of inserting duplicates. Repository packages are not tied to a catalog application.
   */
  private async savePackages(repo: Repo, packages: ExtractedPackage[]) {
    const existing = await Pkg.query().where('repoId', repo.id)
    const known = new Map(existing.map((pkg) => [this.packageKey(pkg), pkg]))
    let created = 0
    let updated = 0

    for (const item of packages) {
      const key = this.packageKey(item)
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
        downloadUrl: item.downloadUrl,
        checksum: item.checksum,
        checksumType: item.checksumType,
        size: item.size,
        installCommand:
          item.type === 'deb' ? `apt install ${item.name}` : `dnf install ${item.name}`,
      })
      await pkg.save()
    }

    return { created, updated }
  }

  private packageKey(pkg: PackageIdentity) {
    return [pkg.name, pkg.version, pkg.release, pkg.arch].map((value) => value ?? '').join('\u0000')
  }
}
