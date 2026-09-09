import '@adonisjs/core/types/http';

type ParamValue = string | number | bigint | boolean;

export type ScannedRoutes = {
  ALL: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: { '*': ParamValue[] } };
    'auth.register': { paramsTuple?: []; params?: {} };
    'auth.login': { paramsTuple?: []; params?: {} };
    'auth.logout': { paramsTuple?: []; params?: {} };
    'auth.user': { paramsTuple?: []; params?: {} };
  };
  GET: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: { '*': ParamValue[] } };
    'auth.user': { paramsTuple?: []; params?: {} };
  };
  HEAD: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: { '*': ParamValue[] } };
    'auth.user': { paramsTuple?: []; params?: {} };
  };
  POST: {
    'auth.register': { paramsTuple?: []; params?: {} };
    'auth.login': { paramsTuple?: []; params?: {} };
    'auth.logout': { paramsTuple?: []; params?: {} };
  };
};
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}
