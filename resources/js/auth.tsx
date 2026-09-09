import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import { clearAuthToken, getAuthToken, getCurrentUser, logout as logoutRequest, type AuthUser } from './services/auth'

type AuthContextValue = {
  user: AuthUser | null
  ready: boolean
  setUser: (user: AuthUser) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(!getAuthToken())

  useEffect(() => {
    if (!getAuthToken()) return

    getCurrentUser()
      .then(setUser)
      .catch(clearAuthToken)
      .finally(() => setReady(true))
  }, [])

  async function logout() {
    try {
      await logoutRequest()
    } finally {
      clearAuthToken()
      setUser(null)
    }
  }

  return <AuthContext value={{ user, ready, setUser, logout }}>{children}</AuthContext>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}