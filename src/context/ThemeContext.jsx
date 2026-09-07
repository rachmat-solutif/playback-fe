// Light/dark theme with system default and cookie persistence.
//
// - Default follows the OS setting (prefers-color-scheme).
// - Once the user toggles, their choice is stored in a `theme` cookie and wins.
// - The .dark class on <html> drives the CSS-variable palette (see index.css).
// - index.html applies the initial class before paint; this context keeps it in sync.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getCookie, setCookie } from '../lib/cookies.js'

const ThemeContext = createContext(null)

const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches

function resolveInitialTheme() {
  const saved = getCookie('theme')
  if (saved === 'light' || saved === 'dark') return saved
  return systemPrefersDark() ? 'dark' : 'light'
}

function applyThemeClass(theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(resolveInitialTheme)

  // Keep the <html> class in sync whenever the theme changes.
  useEffect(() => {
    applyThemeClass(theme)
  }, [theme])

  // While the user hasn't made an explicit choice, follow live system changes.
  useEffect(() => {
    if (getCookie('theme')) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => setTheme(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      setCookie('theme', next) // explicit choice now persists and wins over the system setting
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ theme, isDark: theme === 'dark', toggleTheme }),
    [theme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a <ThemeProvider>')
  return ctx
}
