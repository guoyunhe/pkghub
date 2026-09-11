import type { Data } from '@generated/data'
import xior from 'xior'

import { getAuthToken } from './auth'

export type PkgPayload = {
  appId: number | null
  type: string
  name: string
  version: string
  release: string
  arch: string
  downloadUrl: string
  checksum: string
  checksumType: string
  size: string
  installCommand: string
}

const api = xior.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getPkg(id: number) {
  const { data } = await api.get<{ data: Data.Pkg }>(`/packages/${id}`, {
    headers: authHeaders(),
  })
  return data.data
}

export async function createPkg(payload: PkgPayload) {
  const { data } = await api.post<{ data: Data.Pkg }>('/packages', payload, {
    headers: authHeaders(),
  })
  return data.data
}

export async function updatePkg(id: number, payload: PkgPayload) {
  const { data } = await api.patch<{ data: Data.Pkg }>(`/packages/${id}`, payload, {
    headers: authHeaders(),
  })
  return data.data
}

export async function deletePkg(id: number) {
  await api.delete(`/packages/${id}`, { headers: authHeaders() })
}
