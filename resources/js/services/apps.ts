import type { Data } from '@generated/data'
import xior from 'xior'

import type { Paginated, SerializedPaginated } from '../types/pagination'
import { getAuthToken } from './auth'

export type AppPayload = {
  name: Record<string, string>
  summary: Record<string, string>
  version?: string
  license?: string
  appstreamId?: string
  appstreamUrl?: string
  desktopUrl?: string
}

export type Distro = {
  id: number
  name: string
  version: string | null
  releaseDate: string | null
  eolDate: string | null
}

const api = xior.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getApps(query = '', page = 1) {
  const { data } = await api.get<SerializedPaginated<Data.App>>('/apps', {
    params: { page, q: query || undefined },
  })
  return { data: data.data, meta: data.metadata } satisfies Paginated<Data.App>
}

export async function getDistros() {
  const { data } = await api.get<{ data: Distro[] }>('/distros')
  return data.data
}

export async function getApp(id: number) {
  const { data } = await api.get<{ data: Data.App }>(`/apps/${id}`)
  return data.data
}

export async function getAppPackages(id: number, page = 1) {
  const { data } = await api.get<SerializedPaginated<Data.Pkg>>(`/apps/${id}/packages`, {
    params: { page },
  })
  return { data: data.data, meta: data.metadata } satisfies Paginated<Data.Pkg>
}

export async function searchPackages(query = '', page = 1) {
  const { data } = await api.get<SerializedPaginated<Data.Pkg>>('/packages', {
    params: { page, q: query || undefined },
  })
  return { data: data.data, meta: data.metadata } satisfies Paginated<Data.Pkg>
}

export async function createApp(payload: AppPayload) {
  const { data } = await api.post<{ data: Data.App }>('/apps', payload, { headers: authHeaders() })
  return data.data
}

export async function updateApp(id: number, payload: AppPayload) {
  const { data } = await api.patch<{ data: Data.App }>(`/apps/${id}`, payload, {
    headers: authHeaders(),
  })
  return data.data
}

export async function deleteApp(id: number) {
  await api.delete(`/apps/${id}`, { headers: authHeaders() })
}
