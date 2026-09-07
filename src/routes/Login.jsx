import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { ThemeToggle } from '../components/ThemeToggle.jsx'

// Login page: redirects to /auth/login (server-side Entra ID flow).
// Shows a brief loading state while redirecting.
export default function Login() {
  const { isAuthenticated, loading, login } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      login()
    }
  }, [loading, isAuthenticated, login])

  // If already authenticated, redirect to home
  useEffect(() => {
    if (!loading && isAuthenticated) {
      window.location.href = '/'
    }
  }, [loading, isAuthenticated])

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex flex-col items-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500 text-white">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <h1 className="text-2xl font-bold text-strong">Playback</h1>
          <p className="text-sm text-muted">Redirecting to sign in...</p>
        </div>
      </div>
    </div>
  )
}
