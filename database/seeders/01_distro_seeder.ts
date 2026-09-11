import { BaseSeeder } from '@adonisjs/lucid/seeders'

import Distro from '#models/distro'

const distros = [
  { name: 'Ubuntu', version: '24.04', releaseDate: '2024-04-25', eolDate: '2029-05-31' },
  { name: 'Debian', version: '13', releaseDate: '2025-08-09', eolDate: null },
  { name: 'Fedora Linux', version: '42', releaseDate: null, eolDate: null },
  { name: 'Fedora Linux', version: '43', releaseDate: null, eolDate: null },
  { name: 'Fedora Linux', version: '44', releaseDate: null, eolDate: null },
  { name: 'Linux Mint', version: '22', releaseDate: '2024-07-25', eolDate: '2029-04-01' },
  { name: 'Red Hat Enterprise Linux', version: '9', releaseDate: null, eolDate: '2032-05-31' },
  { name: 'Rocky Linux', version: '9', releaseDate: null, eolDate: '2032-05-31' },
  { name: 'AlmaLinux', version: '9', releaseDate: null, eolDate: '2032-05-31' },
  { name: 'Arch Linux', version: null, releaseDate: null, eolDate: null },
  { name: 'openSUSE Leap', version: '16.0', releaseDate: '2025-10-01', eolDate: null },
  { name: 'openSUSE Tumbleweed', version: null, releaseDate: null, eolDate: null },
  { name: 'Manjaro Linux', version: null, releaseDate: null, eolDate: null },
  { name: 'Pop!_OS', version: '24.04', releaseDate: null, eolDate: null },
  { name: 'SteamOS', version: '3', releaseDate: null, eolDate: null },
  { name: 'NixOS', version: '25.05', releaseDate: null, eolDate: null },
  { name: 'MX Linux', version: '23', releaseDate: null, eolDate: null },
  { name: 'elementary OS', version: '8', releaseDate: null, eolDate: null },
  { name: 'Zorin OS', version: '17', releaseDate: null, eolDate: null },
  { name: 'Kali Linux', version: null, releaseDate: null, eolDate: null },
  { name: 'Gentoo Linux', version: null, releaseDate: null, eolDate: null },
]

export default class DistroSeeder extends BaseSeeder {
  async run() {
    for (const distro of distros) {
      await Distro.updateOrCreate({ name: distro.name, version: distro.version }, distro as any)
    }
  }
}
