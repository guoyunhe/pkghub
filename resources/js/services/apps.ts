import type { Data } from '@generated/data'
import xior from 'xior'

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

const api = xior.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getApps() {
  const { data } = await api.get<{ data: Data.App[] }>('/apps')
  return data.data
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
