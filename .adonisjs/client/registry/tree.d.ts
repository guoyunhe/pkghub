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
  users: {
    show: typeof routes['users.show']
    favorites: typeof routes['users.favorites']
  }
  reviews: {
    userIndex: typeof routes['reviews.user_index']
    index: typeof routes['reviews.index']
    store: typeof routes['reviews.store']
    destroy: typeof routes['reviews.destroy']
  }
  favorites: {
    store: typeof routes['favorites.store']
    destroy: typeof routes['favorites.destroy']
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
  pkgs: {
    search: typeof routes['pkgs.search']
  }
  repos: {
    index: typeof routes['repos.index']
    show: typeof routes['repos.show']
    store: typeof routes['repos.store']
    update: typeof routes['repos.update']
    destroy: typeof routes['repos.destroy']
  }
  distros: {
    index: typeof routes['distros.index']
  }
}
