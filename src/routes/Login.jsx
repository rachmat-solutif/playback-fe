import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { ThemeToggle } from '../components/ThemeToggle.jsx'

const AUTH_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  ? `${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')}/auth`
  : '/auth'

// Login page: provider-aware.
// - When BE AUTH_PROVIDER=entra: auto-redirect to Microsoft via GET /auth/login (no dummy form).
// - When BE AUTH_PROVIDER=dummy/bypass: show dummy form (user/123456) + optional Entra button.
// Uses same-origin proxy when VITE_API_BASE_URL="" (vite.config.js:18).
export default function Login() {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('user')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [provider, setProvider] = useState(null) // 'entra' | 'dummy' | null
  const [checkingProvider, setCheckingProvider] = useState(true)

  // If already authenticated, redirect to home
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [loading, isAuthenticated, navigate])

  // Detect BE auth provider via public GET /auth/config (src/server/auth/index.ts:226, guard.ts:6 isPublicRoute)
  // Returns {authProvider: entra|dummy|none, authBypass: boolean, entraConfigured: boolean}
  // When authProvider==='entra': never show dummy form. If configured -> auto-redirect to Microsoft.
  // If entra but not configured -> show misconfigured state (no dummy form).
  // When authProvider==='dummy'|'none': show dummy form + Entra button.
  // Falls back to legacy GET /auth/login 302 probe if /auth/config unavailable (older BE)
  useEffect(() => {
    if (loading || isAuthenticated) return
    let cancelled = false
    async function probe() {
      setCheckingProvider(true)
      try {
        const res = await fetch(`${AUTH_BASE}/config`, {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        })
        if (res.ok) {
          const data = await res.json().catch(() => ({}))
          if (cancelled) return
          // Entra: never show dummy form. Auto-redirect only if configured.
          if (data.authProvider === 'entra') {
            setProvider('entra')
            if (data.entraConfigured) {
              window.location.href = `${AUTH_BASE}/login`
            } else {
              setError('Entra is selected on BE but not configured (missing ENTRA_CLIENT_ID, ENTRA_TENANT_ID, or ENTRA_CLIENT_SECRET). Set them in playback-be/.env.development and restart BE to enable SSO. Dummy login is not shown because BE is in Entra mode.')
            }
            return
          }
          // dummy / none / bypass -> show dummy form
          setProvider('dummy')
          return
        }
        // Non-200 -> fallback to legacy probe
        throw new Error(`config ${res.status}`)
      } catch {
        // Legacy fallback: GET /auth/login 302 -> Microsoft = entra, 302 / = dummy/bypass
        try {
          const res2 = await fetch(`${AUTH_BASE}/login`, {
            method: 'GET',
            credentials: 'include',
            redirect: 'manual',
          })
          const loc = res2.headers.get('location') || ''
          const isEntra = loc.includes('login.microsoftonline.com')
          if (cancelled) return
          if (isEntra) {
            setProvider('entra')
            window.location.href = `${AUTH_BASE}/login`
            return
          }
          setProvider('dummy')
        } catch {
          if (!cancelled) setProvider('dummy')
        }
      } finally {
        if (!cancelled) setCheckingProvider(false)
      }
    }
    probe()
    return () => { cancelled = true }
  }, [loading, isAuthenticated])

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

  async function handleEntraLogin() {
    // Entra SSO: use public GET /auth/config (index.ts:226) to avoid guessing via redirect probe.
    // In dummy/bypass (AUTH_PROVIDER=dummy) GET /auth/login 302s to "/" and would loop to /login.
    setError('')
    try {
      const res = await fetch(`${AUTH_BASE}/config`, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.authProvider === 'entra' && data.entraConfigured) {
          window.location.href = `${AUTH_BASE}/login`
          return
        }
        if (data.authProvider === 'entra' && !data.entraConfigured) {
          setError('Entra SSO is selected but not configured (missing ENTRA_CLIENT_ID/TENANT_ID/SECRET). Set them in playback-be/.env.development and restart BE.')
          return
        }
        setError('Entra SSO is disabled (BE AUTH_PROVIDER=dummy). Use dummy login above (user / 123456) or set AUTH_PROVIDER=entra + ENTRA_* in playback-be/.env.development and restart BE.')
        return
      }
      // Fallback if /auth/config not available (older BE): probe GET /auth/login redirect
      const res2 = await fetch(`${AUTH_BASE}/login`, {
        method: 'GET',
        credentials: 'include',
        redirect: 'manual',
      })
      const loc = res2.headers.get('location') || ''
      if (loc.includes('login.microsoftonline.com')) {
        window.location.href = `${AUTH_BASE}/login`
        return
      }
      if (res2.type === 'opaqueredirect' || res2.status === 0) {
        window.location.href = `${AUTH_BASE}/login`
        return
      }
      if (loc === '/' || loc.endsWith('/') || res2.status === 302) {
        setError('Entra SSO is disabled (BE AUTH_PROVIDER=dummy). Use dummy login above (user / 123456) or set AUTH_PROVIDER=entra + ENTRA_* in playback-be/.env.development and restart BE.')
        return
      }
      window.location.href = `${AUTH_BASE}/login`
    } catch {
      window.location.href = `${AUTH_BASE}/login`
    }
  }

  if (loading) return null

  if (isAuthenticated) return null

  // While probing provider, show neutral loading. If entra, we will redirect immediately.
  if (checkingProvider) {
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
            <p className="text-sm text-muted">Checking sign-in...</p>
          </div>
        </div>
      </div>
    )
  }

  // Entra mode: auto-redirect already triggered, show redirecting state without dummy form
  if (provider === 'entra') {
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
            <p className="text-sm text-muted">Redirecting to Microsoft sign-in...</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={handleEntraLogin} className="mt-4 text-sm text-muted hover:text-strong underline">
            Continue to Microsoft
          </button>
        </div>
      </div>
    )
  }

  // Dummy / bypass mode: show username/password form
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
