import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.user': { paramsTuple?: []; params?: {} }
    'images.index': { paramsTuple?: []; params?: {} }
    'images.store': { paramsTuple?: []; params?: {} }
    'images.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'images.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'images.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.index': { paramsTuple?: []; params?: {} }
    'apps.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.packages': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'distros.index': { paramsTuple?: []; params?: {} }
    'apps.store': { paramsTuple?: []; params?: {} }
    'apps.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'auth.user': { paramsTuple?: []; params?: {} }
    'images.index': { paramsTuple?: []; params?: {} }
    'images.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.index': { paramsTuple?: []; params?: {} }
    'apps.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.packages': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'distros.index': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'auth.user': { paramsTuple?: []; params?: {} }
    'images.index': { paramsTuple?: []; params?: {} }
    'images.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.index': { paramsTuple?: []; params?: {} }
    'apps.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.packages': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'distros.index': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'images.store': { paramsTuple?: []; params?: {} }
    'apps.store': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'images.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PATCH: {
    'images.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'images.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'apps.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}