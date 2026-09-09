import type { Data } from '@generated/data'

import i18n from '../i18n'
import xior, { isXiorError } from 'xior'

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

type ErrorResponse = {
  message?: string
  errors?: Array<{ message?: string }>
}

const tokenKey = 'pkghub.auth-token'
const api = xior.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getAuthToken()
  config.headers = {
    ...config.headers,
    'Accept-Language': i18n.language,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  return config
})

export function getAuthToken() {
  return localStorage.getItem(tokenKey)
}

export function clearAuthToken() {
  localStorage.removeItem(tokenKey)
}

function setAuthToken(token: string) {
  localStorage.setItem(tokenKey, token)
}

function getErrorMessage(error: unknown) {
  if (isXiorError<ErrorResponse>(error)) {
    const body = error.response?.data
    if (body?.message ?? body?.errors?.[0]?.message) {
      return body.message ?? body.errors?.[0]?.message
    }
  }
  return error instanceof Error ? error.message : 'Request failed'
}

export async function login(payload: LoginPayload) {
  try {
    const { data } = await api.post<{ data: AuthResponse }>('/auth/login', payload)
    setAuthToken(data.data.token)
    return data.data.user
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export async function register(payload: RegisterPayload) {
  try {
    const { data } = await api.post<{ data: AuthResponse }>('/auth/register', payload)
    setAuthToken(data.data.token)
    return data.data.user
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export async function getCurrentUser() {
  try {
    const { data } = await api.get<{ data: AuthUser }>('/auth/user')
    return data.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}

export async function logout() {
  try {
    await api.post('/auth/logout')
  } catch (error) {
    throw new Error(getErrorMessage(error))
  } finally {
    clearAuthToken()
  }
}
