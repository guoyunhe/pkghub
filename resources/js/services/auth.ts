import type { Data } from '@generated/data'

export type AuthUser = Data.User

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = LoginPayload & {
  name: string
  passwordConfirmation: string
}

type AuthResponse = {
  user: AuthUser
  token: string
}

const tokenKey = 'pkghub.auth-token'
const apiUrl = import.meta.env.VITE_API_URL ?? '/api'

export function getAuthToken() {
  return localStorage.getItem(tokenKey)
}

export function clearAuthToken() {
  localStorage.removeItem(tokenKey)
}

function setAuthToken(token: string) {
  localStorage.setItem(tokenKey, token)
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken()
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })
  const body = (await response.json()) as { data?: T; message?: string }

  if (!response.ok) {
    throw new Error(body.message ?? 'Request failed')
  }

  return body.data ?? (body as T)
}

export async function login(payload: LoginPayload) {
  const response = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  setAuthToken(response.token)
  return response.user
}

export async function register(payload: RegisterPayload) {
  const response = await request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  setAuthToken(response.token)
  return response.user
}

export function getCurrentUser() {
  return request<AuthUser>('/auth/user')
}

export async function logout() {
  await request('/auth/logout', { method: 'POST' })
  clearAuthToken()
}