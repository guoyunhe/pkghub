import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.user': { paramsTuple?: []; params?: {} }
    'users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.favorites': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'favorites.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'favorites.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'images.index': { paramsTuple?: []; params?: {} }
    'images.store': { paramsTuple?: []; params?: {} }
    'images.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'images.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'images.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.index': { paramsTuple?: []; params?: {} }
    'apps.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'pkgs.search': { paramsTuple?: []; params?: {} }
    'apps.packages.index': { paramsTuple: [ParamValue]; params: {'app_id': ParamValue} }
    'repos.index': { paramsTuple?: []; params?: {} }
    'repos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'repos.store': { paramsTuple?: []; params?: {} }
    'repos.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'repos.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'distros.index': { paramsTuple?: []; params?: {} }
    'apps.store': { paramsTuple?: []; params?: {} }
    'apps.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'auth.user': { paramsTuple?: []; params?: {} }
    'users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.favorites': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'images.index': { paramsTuple?: []; params?: {} }
    'images.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.index': { paramsTuple?: []; params?: {} }
    'apps.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'pkgs.search': { paramsTuple?: []; params?: {} }
    'apps.packages.index': { paramsTuple: [ParamValue]; params: {'app_id': ParamValue} }
    'repos.index': { paramsTuple?: []; params?: {} }
    'repos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'distros.index': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'auth.user': { paramsTuple?: []; params?: {} }
    'users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'users.favorites': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'images.index': { paramsTuple?: []; params?: {} }
    'images.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.index': { paramsTuple?: []; params?: {} }
    'apps.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'pkgs.search': { paramsTuple?: []; params?: {} }
    'apps.packages.index': { paramsTuple: [ParamValue]; params: {'app_id': ParamValue} }
    'repos.index': { paramsTuple?: []; params?: {} }
    'repos.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'distros.index': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'favorites.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'images.store': { paramsTuple?: []; params?: {} }
    'repos.store': { paramsTuple?: []; params?: {} }
    'apps.store': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'favorites.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'images.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'repos.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'images.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'repos.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PATCH: {
    'images.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'repos.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}