import type { Data } from '@generated/data'
import xior from 'xior'

import { getAuthToken } from './auth'

export type RepoPayload = {
  type: string
  name: string
  baseUrl: string
  distroId: number | null
  keyUrl: string
  keyFingerprint: string
  repositoryFile: string
  enabled: boolean
  priority: string
  syncIntervalDays: string
}

const api = xior.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getRepos() {
  const { data } = await api.get<{ data: Data.Repo[] }>('/repos')
  return data.data
}

export async function getRepo(id: number) {
  const { data } = await api.get<{ data: Data.Repo }>(`/repos/${id}`)
  return data.data
}

export async function createRepo(payload: RepoPayload) {
  const { data } = await api.post<{ data: Data.Repo }>('/repos', payload, {
    headers: authHeaders(),
  })
  return data.data
}

export async function updateRepo(id: number, payload: RepoPayload) {
  const { data } = await api.patch<{ data: Data.Repo }>(`/repos/${id}`, payload, {
    headers: authHeaders(),
  })
  return data.data
}

export async function deleteRepo(id: number) {
  await api.delete(`/repos/${id}`, { headers: authHeaders() })
}
