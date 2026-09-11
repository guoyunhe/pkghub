import type { Data } from '@generated/data'
import xior from 'xior'

import { getAuthToken } from './auth'

const api = xior.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getPkg(id: number) {
  const { data } = await api.get<{ data: Data.Pkg }>(`/pkgs/${id}`, {
    headers: authHeaders(),
  })
  return data.data
}

export async function createPkg(payload: Partial<Data.Pkg>) {
  const { data } = await api.post<{ data: Data.Pkg }>('/pkgs', payload, {
    headers: authHeaders(),
  })
  return data.data
}

export async function updatePkg(id: number, payload: Partial<Data.Pkg>) {
  const { data } = await api.patch<{ data: Data.Pkg }>(`/pkgs/${id}`, payload, {
    headers: authHeaders(),
  })
  return data.data
}

export async function deletePkg(id: number) {
  await api.delete(`/pkgs/${id}`, { headers: authHeaders() })
}
