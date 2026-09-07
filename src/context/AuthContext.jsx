// Session-based auth context.
// On mount, calls GET /auth/me to check if a valid session exists.
// If not authenticated, redirects to /auth/login (which goes to Microsoft).
// Supports split deployment via VITE_API_BASE_URL (BE on different origin).

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const AUTH_BASE = API_BASE ? `${API_BASE}/auth` : '/auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check session on mount
  useEffect(() => {
    fetch(`${AUTH_BASE}/me`, { credentials: 'include' })
      .then((res) => {
        if (res.ok) return res.json()
        return null
      })
      .then((data) => {
        if (data) setUser(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(() => {
    // Redirect to server-side login (Entra ID), passing FE origin for multi-client SSO.
    // BE validates ?redirect against APP_ORIGINS allowlist (plus FRONTEND_URL fallback) and stores in session for /auth/callback.
    const redirect = encodeURIComponent(window.location.origin)
    window.location.href = `${AUTH_BASE}/login?redirect=${redirect}`
  }, [])

  const logout = useCallback(() => {
    // Redirect to server-side logout (destroys session + Microsoft logout), passing FE origin.
    const redirect = encodeURIComponent(window.location.origin)
    window.location.href = `${AUTH_BASE}/logout?redirect=${redirect}`
  }, [])

  const isAuthenticated = !!user

  const value = useMemo(
    () => ({ isAuthenticated, user, username: user?.name || null, loading, login, logout }),
    [isAuthenticated, user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>')
  return ctx
}
