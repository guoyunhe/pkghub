import { BaseSeeder } from '@adonisjs/lucid/seeders'

import Distro from '#models/distro'
import Repo from '#models/repo'

const repos = [
  {
    name: 'openSUSE Tumbleweed OSS',
    type: 'rpm',
    source: 'distro',
    baseUrl: 'https://download.opensuse.org/tumbleweed/repo/oss/',
    distroName: 'openSUSE Tumbleweed',
    distroVersion: null,
    repositoryFile: null,
  },
  {
    name: 'openSUSE Tumbleweed Non-OSS',
    source: 'distro',
    baseUrl: 'https://download.opensuse.org/tumbleweed/repo/non-oss/',
    distroName: 'openSUSE Tumbleweed',
    distroVersion: null,
    type: 'rpm',
    repositoryFile: null,
  },
  {
    name: 'openSUSE Tumbleweed Update',
    source: 'distro',
    baseUrl: 'https://download.opensuse.org/update/tumbleweed/',
    distroName: 'openSUSE Tumbleweed',
    distroVersion: null,
    type: 'rpm',
    repositoryFile: null,
  },
  {
    name: 'Debian 13 Main',
    source: 'distro',
    baseUrl: 'https://deb.debian.org/debian/',
    distroName: 'Debian',
    distroVersion: '13',
    type: 'deb',
    repositoryFile:
      'deb https://deb.debian.org/debian trixie main contrib non-free non-free-firmware',
  },
  {
    name: 'Debian 13 Updates',
    source: 'distro',
    baseUrl: 'https://deb.debian.org/debian/',
    distroName: 'Debian',
    distroVersion: '13',
    type: 'deb',
    repositoryFile:
      'deb https://deb.debian.org/debian trixie-updates main contrib non-free non-free-firmware',
  },
  {
    name: 'Debian 13 Security',
    type: 'deb',
    source: 'distro',
    distroName: 'Debian',
    distroVersion: '13',
    baseUrl: 'https://security.debian.org/debian-security/',
    repositoryFile:
      'deb https://security.debian.org/debian-security trixie-security main contrib non-free non-free-firmware',
  },
  ...['42', '43', '44'].map((ver) => ({
    name: `RPM Fusion for Fedora ${ver} - Free`,
    type: 'rpm',
    source: 'community',
    installScript: `pkexec dnf install -y https://download1.rpmfusion.org/free/fedora/rpmfusion-free-release-${ver}.noarch.rpm`,
    distroName: 'Fedora Linux',
    distroVersion: ver,
    baseUrl: `http://download1.rpmfusion.org/free/fedora/releases/${ver}/Everything/x86_64/os/`,
  })),
]

export default class RepoSeeder extends BaseSeeder {
  async run() {
    for (const repo of repos) {
      const { distroName, distroVersion, ...attributes } = repo
      let distroId = null

      if (distroName) {
        const distroQuery = Distro.query().where('name', distroName)

        if (distroVersion === null) {
          distroQuery.whereNull('version')
        } else {
          distroQuery.where('version', distroVersion)
        }

        console.log(distroName, distroVersion)
        distroId = (await distroQuery.firstOrFail()).id
      }

      await Repo.updateOrCreate(
        { name: repo.name },
        {
          ...attributes,
          distroId,
          keyUrl: null,
          keyFingerprint: null,
          enabled: true,
          priority: null,
        },
      )
    }
  }
}
