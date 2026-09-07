import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { ThemeToggle } from './ThemeToggle.jsx'

// App shell for authenticated routes: top nav + routed content via <Outlet>.
// Below md the nav collapses into a hamburger menu that also holds the theme
// toggle, the signed-in text, and sign out.
export function Layout() {
  const { username, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
  }

  const navClass = ({ isActive }) =>
    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-primary-50 text-primary-700' : 'text-body hover:bg-surface-muted'
    }`

  const mobileNavClass = ({ isActive }) =>
    `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-primary-50 text-primary-700' : 'text-body hover:bg-surface-muted'
    }`

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-surface backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-500 text-white">
                <PlayIcon />
              </span>
              <span className="text-lg font-bold text-strong">Playback</span>
            </Link>
            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 md:flex">
              <NavLink to="/conversations" className={navClass}>
                Conversations
              </NavLink>
            </nav>
          </div>

          {/* Desktop right cluster: theme toggle sits right before the signed-in text. */}
          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            <span className="text-sm text-muted">
              Signed in as <span className="font-medium text-body">{username}</span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-body hover:bg-surface-muted"
            >
              Sign out
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-body hover:bg-surface-muted md:hidden"
          >
            {menuOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <div id="mobile-menu" className="border-t border-line bg-surface md:hidden">
            <nav className="space-y-1 px-4 py-3">
              <NavLink
                to="/conversations"
                className={mobileNavClass}
                onClick={() => setMenuOpen(false)}
              >
                Conversations
              </NavLink>

              <div className="!mt-3 border-t border-line pt-3">
                {/* Theme toggle lives in the menu on mobile, with a label. */}
                <ThemeToggle withLabel />
                <p className="px-1 py-2 text-sm text-muted">
                  Signed in as <span className="font-medium text-body">{username}</span>
                </p>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-md border border-line px-3 py-2 text-left text-sm font-medium text-body hover:bg-surface-muted"
                >
                  Sign out
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-1 px-4 py-6 text-xs text-faint sm:flex-row sm:px-6">
          <p>Playback</p>
          <p>Mock data only. Not for production use.</p>
        </div>
      </footer>
    </div>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function HamburgerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}
