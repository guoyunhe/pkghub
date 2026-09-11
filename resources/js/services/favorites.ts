import xior from 'xior'

import { getAuthToken } from './auth'

const api = xior.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' })

function authHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function addFavorite(appId: number) {
  await api.post(`/apps/${appId}/favorite`, {}, { headers: authHeaders() })
}

export async function removeFavorite(appId: number) {
  await api.delete(`/apps/${appId}/favorite`, { headers: authHeaders() })
}
