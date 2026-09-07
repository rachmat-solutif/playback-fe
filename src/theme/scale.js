// Derive Tailwind primary 50..900 scale from a single primary hex.
// Build-time only, no runtime cost. Uses colord for lighten/darken.

import { colord } from 'colord'

const HEX_RE = /^#[0-9a-fA-F]{6}$/

export function validateHex(hex) {
  if (!HEX_RE.test(hex)) {
    throw new Error(`[theme] Invalid hex "${hex}". Expected "#rrggbb" e.g. "#d31145"`)
  }
}

export function buildScale(primary) {
  validateHex(primary)
  const base = colord(primary)

  // Keep current brand tints close to original #d31145 mapping:
  // 50:#fdf4f6, 100:#f8dbe3, 200:#f3bccb, 300:#e88ba5, 400:#dd4f74.
  // For other primaries we derive via lighten so each theme has its own pastel range.
  // 500 = primary, 600 darken 12%, 700 darken 24%, 800 32%, 900 40%.
  return {
    50: base.lighten(0.48).toHex(),
    100: base.lighten(0.38).toHex(),
    200: base.lighten(0.28).toHex(),
    300: base.lighten(0.18).toHex(),
    400: base.lighten(0.08).toHex(),
    500: base.toHex(),
    600: base.darken(0.12).toHex(),
    700: base.darken(0.24).toHex(),
    800: base.darken(0.32).toHex(),
    900: base.darken(0.40).toHex(),
  }
}

export function scaleToCssVars(scale) {
  // Map scale to CSS variables consumed by tailwind.config.js and index.css.
  return {
    '--primary-50': scale[50],
    '--primary-100': scale[100],
    '--primary-200': scale[200],
    '--primary-300': scale[300],
    '--primary-400': scale[400],
    '--primary-color': scale[500],
    '--primary-hover': scale[600],
    '--primary-focus': scale[700],
    '--primary-800': scale[800],
    '--primary-900': scale[900],
  }
}
