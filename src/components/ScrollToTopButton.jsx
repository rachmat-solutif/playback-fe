import { useEffect, useRef, useState } from 'react'

// Floating "scroll to top" button following the UX rules:
//  - hidden on first load (state starts false; only scroll/resize can reveal it)
//  - scroll work is throttled to one measurement per animation frame
//  - shows/hides via an opacity + translate CSS transition (never display swap)
//  - fades out before it would overlap the page footer / legal text
//  - hides while an on-screen keyboard is open so it can't block inputs
const SHOW_AFTER = 300 // px of vertical scroll before the button appears
const FOOTER_GAP = 24 // px of breathing room to keep above the footer

export function ScrollToTopButton() {
  const [pastThreshold, setPastThreshold] = useState(false)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const ticking = useRef(false)

  // --- scroll position + footer boundary (throttled via requestAnimationFrame) ---
  useEffect(() => {
    const evaluate = () => {
      ticking.current = false
      const scrolled = window.scrollY || document.documentElement.scrollTop
      let show = scrolled > SHOW_AFTER

      // Footer boundary: once the footer scrolls into the button's resting zone, hide.
      if (show) {
        const footer = document.querySelector('footer')
        if (footer) {
          const footerTop = footer.getBoundingClientRect().top
          if (footerTop < window.innerHeight - FOOTER_GAP) show = false
        }
      }
      setPastThreshold(show)
    }

    const onScroll = () => {
      // Throttle: coalesce rapid scroll events into a single per-frame measurement.
      if (!ticking.current) {
        ticking.current = true
        window.requestAnimationFrame(evaluate)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  // --- on-screen keyboard detection (input-field bypass) ---
  useEffect(() => {
    const vv = window.visualViewport
    if (vv) {
      // The keyboard shrinks the visual viewport well below the layout height.
      const onViewport = () => setKeyboardOpen(window.innerHeight - vv.height > 150)
      vv.addEventListener('resize', onViewport)
      return () => vv.removeEventListener('resize', onViewport)
    }

    // Fallback for browsers without VisualViewport: hide when a text field is
    // focused on a narrow (mobile) screen.
    const isMobile = () => window.innerWidth < 768
    const isTextField = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')
    const onFocusIn = (e) => {
      if (isMobile() && isTextField(e.target)) setKeyboardOpen(true)
    }
    const onFocusOut = () => setKeyboardOpen(false)
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  const shown = pastThreshold && !keyboardOpen

  const handleClick = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Scroll to top"
      aria-hidden={!shown}
      tabIndex={shown ? 0 : -1}
      className={`fixed bottom-6 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg transition-all duration-300 ease-out hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-canvas ${
        shown ? 'opacity-100 translate-y-0' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  )
}
