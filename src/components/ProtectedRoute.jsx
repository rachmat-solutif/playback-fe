import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Redirects to /login (frontend) when not authenticated.
// Shows nothing while checking session to avoid flash.
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
