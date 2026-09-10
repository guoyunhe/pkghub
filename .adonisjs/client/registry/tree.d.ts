/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  drive: {
    fs: {
      serve: typeof routes['drive.fs.serve']
    }
  }
  auth: {
    register: typeof routes['auth.register']
    login: typeof routes['auth.login']
    logout: typeof routes['auth.logout']
    user: typeof routes['auth.user']
  }
  images: {
    index: typeof routes['images.index']
    store: typeof routes['images.store']
    show: typeof routes['images.show']
    update: typeof routes['images.update']
    destroy: typeof routes['images.destroy']
  }
  apps: {
    index: typeof routes['apps.index']
    show: typeof routes['apps.show']
    packages: {
      index: typeof routes['apps.packages.index']
    }
    store: typeof routes['apps.store']
    update: typeof routes['apps.update']
    destroy: typeof routes['apps.destroy']
  }
  distros: {
    index: typeof routes['distros.index']
  }
}
