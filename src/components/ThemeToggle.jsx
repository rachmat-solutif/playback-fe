import { useTheme } from '../context/ThemeContext.jsx'

// Theme toggle button. Icon-only by default (header / login corner); pass
// `withLabel` to also show a text label (used inside the mobile menu).
export function ThemeToggle({ withLabel = false, className = '' }) {
  const { isDark, toggleTheme } = useTheme()
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={
        withLabel
          ? `flex w-full items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium text-body hover:bg-surface-muted ${className}`
          : `flex h-9 w-9 items-center justify-center rounded-md border border-line text-body hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface ${className}`
      }
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      {withLabel && <span>{isDark ? 'Light theme' : 'Dark theme'}</span>}
    </button>
  )
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"
      />
    </svg>
  )
}
