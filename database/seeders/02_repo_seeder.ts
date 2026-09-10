import { BaseSeeder } from '@adonisjs/lucid/seeders'

import Distro from '#models/distro'
import Repo from '#models/repo'

const repos = [
  {
    name: 'openSUSE Tumbleweed OSS',
    baseUrl: 'https://download.opensuse.org/tumbleweed/repo/oss/',
    distroName: 'openSUSE Tumbleweed',
    distroVersion: null,
    type: 'rpm' as const,
    repositoryFile: null,
  },
  {
    name: 'openSUSE Tumbleweed Non-OSS',
    baseUrl: 'https://download.opensuse.org/tumbleweed/repo/non-oss/',
    distroName: 'openSUSE Tumbleweed',
    distroVersion: null,
    type: 'rpm' as const,
    repositoryFile: null,
  },
  {
    name: 'openSUSE Tumbleweed Update',
    baseUrl: 'https://download.opensuse.org/update/tumbleweed/',
    distroName: 'openSUSE Tumbleweed',
    distroVersion: null,
    type: 'rpm' as const,
    repositoryFile: null,
  },
  {
    name: 'Debian 13 Main',
    baseUrl: 'https://deb.debian.org/debian/',
    distroName: 'Debian',
    distroVersion: '13',
    type: 'deb' as const,
    repositoryFile:
      'deb https://deb.debian.org/debian trixie main contrib non-free non-free-firmware',
  },
  {
    name: 'Debian 13 Updates',
    baseUrl: 'https://deb.debian.org/debian/',
    distroName: 'Debian',
    distroVersion: '13',
    type: 'deb' as const,
    repositoryFile:
      'deb https://deb.debian.org/debian trixie-updates main contrib non-free non-free-firmware',
  },
  {
    name: 'Debian 13 Security',
    baseUrl: 'https://security.debian.org/debian-security/',
    distroName: 'Debian',
    distroVersion: '13',
    type: 'deb' as const,
    repositoryFile:
      'deb https://security.debian.org/debian-security trixie-security main contrib non-free non-free-firmware',
  },
]

export default class RepoSeeder extends BaseSeeder {
  async run() {
    for (const repo of repos) {
      const { distroName, distroVersion, ...attributes } = repo
      const distroQuery = Distro.query().where('name', distroName)

      if (distroVersion === null) {
        distroQuery.whereNull('version')
      } else {
        distroQuery.where('version', distroVersion)
      }

      const distro = await distroQuery.firstOrFail()

      await Repo.updateOrCreate(
        { name: repo.name },
        {
          ...attributes,
          distroId: distro.id,
          keyUrl: null,
          keyFingerprint: null,
          enabled: true,
          priority: null,
        },
      )
    }
  }
}
