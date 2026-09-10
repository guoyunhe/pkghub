import { args, BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import chalk from 'chalk'

import Repo from '#models/repo'
import RepoPackageExtractor from '#services/repo_package_extractor'

export default class RepoSync extends BaseCommand {
  static commandName = 'repo:sync'
  static description = 'Extract package metadata from configured deb/rpm repositories'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({
    description: 'Repository name (defaults to all enabled deb/rpm repositories)',
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
      : await Repo.query().whereIn('type', ['deb', 'rpm']).andWhere('enabled', true)

    if (repos.length === 0) {
      this.logger.warning('No enabled deb/rpm repositories found')
      return
    }

    const extractor = new RepoPackageExtractor()

    for (const repo of repos) {
      this.logger.info(`Extracting packages from ${chalk.cyan(repo.name)} (${repo.type})`)
      try {
        const packages = await extractor.extract(repo, { arch: this.arch || undefined })
        this.logger.info(`${repo.name}: extracted ${chalk.green(String(packages.length))} packages`)
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
}
