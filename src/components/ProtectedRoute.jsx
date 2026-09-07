import { useAuth } from '../context/AuthContext.jsx'

const AUTH_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  ? `${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')}/auth`
  : '/auth'

// Redirects to /auth/login (server-side Entra ID) when not authenticated.
// Shows nothing while checking session to avoid flash.
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return null
  }

  if (!isAuthenticated) {
    window.location.href = `${AUTH_BASE}/login`
    return null
  }

  return children
}
