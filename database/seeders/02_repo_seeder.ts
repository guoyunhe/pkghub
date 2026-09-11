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
    configContent: null,
  },
  {
    name: 'openSUSE Tumbleweed Non-OSS',
    source: 'distro',
    baseUrl: 'https://download.opensuse.org/tumbleweed/repo/non-oss/',
    distroName: 'openSUSE Tumbleweed',
    distroVersion: null,
    type: 'rpm',
    configContent: null,
  },
  {
    name: 'openSUSE Tumbleweed Update',
    source: 'distro',
    baseUrl: 'https://download.opensuse.org/update/tumbleweed/',
    distroName: 'openSUSE Tumbleweed',
    distroVersion: null,
    type: 'rpm',
    configContent: null,
  },
  {
    name: 'VLC for openSUSE Tumbleweed',
    type: 'rpm',
    source: 'community',
    baseUrl: 'https://download.videolan.org/SuSE/Tumbleweed/',
    distroName: 'openSUSE Tumbleweed',
    distroVersion: null,
    configContent: `[SuSE]
name=VideoLAN repo (Tumbleweed)
type=rpm-md
baseurl=http://download.videolan.org/SuSE/Tumbleweed/
gpgcheck=1
gpgkey=http://download.videolan.org/SuSE/Tumbleweed/repodata/repomd.xml.key
enabled=1
`,
    configUrl: 'https://download.videolan.org/SuSE/Tumbleweed/SuSE.repo',
    installScript: `pkexec zypper addrepo -y https://download.videolan.org/SuSE/Tumbleweed/SuSE.repo`,
  },
  {
    name: 'Debian 13 Main',
    source: 'distro',
    baseUrl: 'https://deb.debian.org/debian/',
    distroName: 'Debian',
    distroVersion: '13',
    type: 'deb',
    configContent:
      'deb https://deb.debian.org/debian trixie main contrib non-free non-free-firmware',
  },
  {
    name: 'Debian 13 Updates',
    source: 'distro',
    baseUrl: 'https://deb.debian.org/debian/',
    distroName: 'Debian',
    distroVersion: '13',
    type: 'deb',
    configContent:
      'deb https://deb.debian.org/debian trixie-updates main contrib non-free non-free-firmware',
  },
  {
    name: 'Debian 13 Security',
    type: 'deb',
    source: 'distro',
    distroName: 'Debian',
    distroVersion: '13',
    baseUrl: 'https://security.debian.org/debian-security/',
    configContent:
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
    configContent: `[rpmfusion-free]
name=RPM Fusion for Fedora $releasever - Free
#baseurl=http://download1.rpmfusion.org/free/fedora/releases/$releasever/Everything/$basearch/os/
metalink=https://mirrors.rpmfusion.org/metalink?repo=free-fedora-$releasever&arch=$basearch
enabled=0
metadata_expire=14d
type=rpm-md
gpgcheck=1
repo_gpgcheck=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-rpmfusion-free-fedora-$releasever

[rpmfusion-free-debuginfo]
name=RPM Fusion for Fedora $releasever - Free - Debug
#baseurl=http://download1.rpmfusion.org/free/fedora/releases/$releasever/Everything/$basearch/debug/
metalink=https://mirrors.rpmfusion.org/metalink?repo=free-fedora-debug-$releasever&arch=$basearch
enabled=0
metadata_expire=7d
type=rpm-md
gpgcheck=1
repo_gpgcheck=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-rpmfusion-free-fedora-$releasever

[rpmfusion-free-source]
name=RPM Fusion for Fedora $releasever - Free - Source
#baseurl=http://download1.rpmfusion.org/free/fedora/releases/$releasever/Everything/source/SRPMS/
metalink=https://mirrors.rpmfusion.org/metalink?repo=free-fedora-source-$releasever&arch=$basearch
enabled=0
metadata_expire=7d
type=rpm-md
gpgcheck=1
repo_gpgcheck=0
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-rpmfusion-free-fedora-$releasever
`,
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

        const distro = await distroQuery.firstOrFail()
        distroId = distro.id
      }

      await Repo.updateOrCreate(
        { name: repo.name },
        {
          ...attributes,
          distroId,
        },
      )
    }
  }
}
