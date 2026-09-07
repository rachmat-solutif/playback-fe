import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { ThemeToggle } from '../components/ThemeToggle.jsx'

const AUTH_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  ? `${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')}/auth`
  : '/auth'

// Login page: dummy auth form (user/123456) for local dev + Entra SSO redirect.
// Uses same-origin proxy when VITE_API_BASE_URL="" (vite.config.js proxy).
export default function Login() {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('user')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // If already authenticated, redirect to home
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [loading, isAuthenticated, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch(`${AUTH_BASE}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || data.message || `Login failed: ${res.status}`)
      }
      // Session cookie set; reload auth state via hard navigation
      window.location.href = '/'
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  function handleEntraLogin() {
    // Entra SSO: GET /auth/login redirects to Microsoft (when AUTH_PROVIDER=entra)
    window.location.href = `${AUTH_BASE}/login`
  }

  if (loading) return null

  if (isAuthenticated) return null

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500 text-white">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <h1 className="text-2xl font-bold text-strong">Playback</h1>
          <p className="text-sm text-muted">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-strong">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="user"
              className="w-full rounded-lg border border-default bg-surface px-3 py-2 text-sm text-strong outline-none focus:border-primary-500"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-strong">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="123456"
              className="w-full rounded-lg border border-default bg-surface px-3 py-2 text-sm text-strong outline-none focus:border-primary-500"
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {submitting ? 'Signing in...' : 'Sign in (dummy)'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button onClick={handleEntraLogin} className="text-sm text-muted hover:text-strong underline">
            Sign in with Microsoft (Entra)
          </button>
          <p className="mt-2 text-xs text-muted">Dummy: user / 123456 (seeded). Entra: redirects to Microsoft.</p>
        </div>
      </div>
    </div>
  )
}
