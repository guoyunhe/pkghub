import type { Data } from '@generated/data'
import xior from 'xior'

import { getAuthToken } from './auth'

const api = xior.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getImages() {
  const { data } = await api.get<{ data: Data.Image[] }>('/images', { headers: authHeaders() })
  return data.data
}
