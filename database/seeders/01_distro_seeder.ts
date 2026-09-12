import { BaseSeeder } from '@adonisjs/lucid/seeders'

import Distro from '#models/distro'

/** Architecture names follow `uname -m`, the same vocabulary used by the package extractors. */
const arches = ['x86_64', 'aarch64']
const distros = [
  {
    name: 'Ubuntu',
    version: '24.04',
    pkgType: 'deb',
    arch: arches,
    releaseDate: '2024-04-25',
    eolDate: '2029-05-31',
  },
  {
    name: 'Debian',
    version: '13',
    pkgType: 'deb',
    arch: arches,
    releaseDate: '2025-08-09',
    eolDate: null,
  },
  {
    name: 'Fedora Linux',
    version: '42',
    pkgType: 'rpm',
    arch: arches,
    releaseDate: null,
    eolDate: null,
  },
  {
    name: 'Fedora Linux',
    version: '43',
    pkgType: 'rpm',
    arch: arches,
    releaseDate: null,
    eolDate: null,
  },
  {
    name: 'Fedora Linux',
    version: '44',
    pkgType: 'rpm',
    arch: arches,
    releaseDate: null,
    eolDate: null,
  },
  {
    name: 'Linux Mint',
    version: '22',
    pkgType: 'deb',
    arch: ['x86_64'],
    releaseDate: '2024-07-25',
    eolDate: '2029-04-01',
  },
  {
    name: 'Red Hat Enterprise Linux',
    version: '9',
    pkgType: 'rpm',
    arch: arches,
    releaseDate: null,
    eolDate: '2032-05-31',
  },
  {
    name: 'Rocky Linux',
    version: '9',
    pkgType: 'rpm',
    arch: arches,
    releaseDate: null,
    eolDate: '2032-05-31',
  },
  {
    name: 'AlmaLinux',
    version: '9',
    pkgType: 'rpm',
    arch: arches,
    releaseDate: null,
    eolDate: '2032-05-31',
  },
  {
    name: 'Arch Linux',
    version: null,
    pkgType: null,
    arch: ['x86_64'],
    releaseDate: null,
    eolDate: null,
  },
  {
    name: 'openSUSE Leap',
    version: '16.0',
    pkgType: 'rpm',
    arch: arches,
    releaseDate: '2025-10-01',
    eolDate: null,
  },
  {
    name: 'openSUSE Tumbleweed',
    version: null,
    pkgType: 'rpm',
    arch: arches,
    releaseDate: null,
    eolDate: null,
  },
  {
    name: 'Manjaro Linux',
    version: null,
    pkgType: null,
    arch: arches,
    releaseDate: null,
    eolDate: null,
  },
  {
    name: 'Pop!_OS',
    version: '24.04',
    pkgType: 'deb',
    arch: arches,
    releaseDate: null,
    eolDate: null,
  },
  {
    name: 'SteamOS',
    version: '3',
    pkgType: 'deb',
    arch: ['x86_64'],
    releaseDate: null,
    eolDate: null,
  },
  {
    name: 'NixOS',
    version: '25.05',
    pkgType: null,
    arch: arches,
    releaseDate: null,
    eolDate: null,
  },
  {
    name: 'MX Linux',
    version: '23',
    pkgType: 'deb',
    arch: arches,
    releaseDate: null,
    eolDate: null,
  },
  {
    name: 'elementary OS',
    version: '8',
    pkgType: 'deb',
    arch: arches,
    releaseDate: null,
    eolDate: null,
  },
  {
    name: 'Zorin OS',
    version: '17',
    pkgType: 'deb',
    arch: ['x86_64'],
    releaseDate: null,
    eolDate: null,
  },
  {
    name: 'Kali Linux',
    version: null,
    pkgType: 'deb',
    arch: arches,
    releaseDate: null,
    eolDate: null,
  },
  {
    name: 'Gentoo Linux',
    version: null,
    pkgType: null,
    arch: arches,
    releaseDate: null,
    eolDate: null,
  },
]

export default class DistroSeeder extends BaseSeeder {
  async run() {
    for (const distro of distros) {
      await Distro.updateOrCreate({ name: distro.name, version: distro.version }, distro as any)
    }
  }
}
