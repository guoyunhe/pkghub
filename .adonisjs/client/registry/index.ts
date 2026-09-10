/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'drive.fs.serve': {
    methods: ["GET","HEAD"],
    pattern: '/uploads/*',
    tokens: [{"old":"/uploads/*","type":0,"val":"uploads","end":""},{"old":"/uploads/*","type":2,"val":"*","end":""}],
    types: placeholder as Registry['drive.fs.serve']['types'],
  },
  'auth.register': {
    methods: ["POST"],
    pattern: '/api/auth/register',
    tokens: [{"old":"/api/auth/register","type":0,"val":"api","end":""},{"old":"/api/auth/register","type":0,"val":"auth","end":""},{"old":"/api/auth/register","type":0,"val":"register","end":""}],
    types: placeholder as Registry['auth.register']['types'],
  },
  'auth.login': {
    methods: ["POST"],
    pattern: '/api/auth/login',
    tokens: [{"old":"/api/auth/login","type":0,"val":"api","end":""},{"old":"/api/auth/login","type":0,"val":"auth","end":""},{"old":"/api/auth/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.login']['types'],
  },
  'auth.logout': {
    methods: ["POST"],
    pattern: '/api/auth/logout',
    tokens: [{"old":"/api/auth/logout","type":0,"val":"api","end":""},{"old":"/api/auth/logout","type":0,"val":"auth","end":""},{"old":"/api/auth/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['auth.logout']['types'],
  },
  'auth.user': {
    methods: ["GET","HEAD"],
    pattern: '/api/auth/user',
    tokens: [{"old":"/api/auth/user","type":0,"val":"api","end":""},{"old":"/api/auth/user","type":0,"val":"auth","end":""},{"old":"/api/auth/user","type":0,"val":"user","end":""}],
    types: placeholder as Registry['auth.user']['types'],
  },
  'images.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/images',
    tokens: [{"old":"/api/images","type":0,"val":"api","end":""},{"old":"/api/images","type":0,"val":"images","end":""}],
    types: placeholder as Registry['images.index']['types'],
  },
  'images.store': {
    methods: ["POST"],
    pattern: '/api/images',
    tokens: [{"old":"/api/images","type":0,"val":"api","end":""},{"old":"/api/images","type":0,"val":"images","end":""}],
    types: placeholder as Registry['images.store']['types'],
  },
  'images.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/images/:id',
    tokens: [{"old":"/api/images/:id","type":0,"val":"api","end":""},{"old":"/api/images/:id","type":0,"val":"images","end":""},{"old":"/api/images/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['images.show']['types'],
  },
  'images.update': {
    methods: ["PUT","PATCH"],
    pattern: '/api/images/:id',
    tokens: [{"old":"/api/images/:id","type":0,"val":"api","end":""},{"old":"/api/images/:id","type":0,"val":"images","end":""},{"old":"/api/images/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['images.update']['types'],
  },
  'images.destroy': {
    methods: ["DELETE"],
    pattern: '/api/images/:id',
    tokens: [{"old":"/api/images/:id","type":0,"val":"api","end":""},{"old":"/api/images/:id","type":0,"val":"images","end":""},{"old":"/api/images/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['images.destroy']['types'],
  },
  'apps.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/apps',
    tokens: [{"old":"/api/apps","type":0,"val":"api","end":""},{"old":"/api/apps","type":0,"val":"apps","end":""}],
    types: placeholder as Registry['apps.index']['types'],
  },
  'apps.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/apps/:id',
    tokens: [{"old":"/api/apps/:id","type":0,"val":"api","end":""},{"old":"/api/apps/:id","type":0,"val":"apps","end":""},{"old":"/api/apps/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['apps.show']['types'],
  },
  'distros.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/distros',
    tokens: [{"old":"/api/distros","type":0,"val":"api","end":""},{"old":"/api/distros","type":0,"val":"distros","end":""}],
    types: placeholder as Registry['distros.index']['types'],
  },
  'apps.store': {
    methods: ["POST"],
    pattern: '/api/apps',
    tokens: [{"old":"/api/apps","type":0,"val":"api","end":""},{"old":"/api/apps","type":0,"val":"apps","end":""}],
    types: placeholder as Registry['apps.store']['types'],
  },
  'apps.update': {
    methods: ["PUT","PATCH"],
    pattern: '/api/apps/:id',
    tokens: [{"old":"/api/apps/:id","type":0,"val":"api","end":""},{"old":"/api/apps/:id","type":0,"val":"apps","end":""},{"old":"/api/apps/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['apps.update']['types'],
  },
  'apps.destroy': {
    methods: ["DELETE"],
    pattern: '/api/apps/:id',
    tokens: [{"old":"/api/apps/:id","type":0,"val":"api","end":""},{"old":"/api/apps/:id","type":0,"val":"apps","end":""},{"old":"/api/apps/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['apps.destroy']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
