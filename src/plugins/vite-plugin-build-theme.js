// Vite plugin: build-time theme via VITE_THEME / VITE_THEME_PRIMARY.
// Perf: zero runtime fetch, baked at build. Dev HMR on .env or presets change.
// Injects <style id="build-theme"> into <head> before the flash-prevention script
// and patches src/index.css fallback vars so dist/css is baked.

import { loadEnv } from 'vite'
import { presets, defaultPreset, resolvePreset } from '../theme/presets.js'
import { buildScale, scaleToCssVars, validateHex } from '../theme/scale.js'

function getThemeFromEnv(mode, envDir) {
  const env = loadEnv(mode, envDir || process.cwd(), 'VITE_')
  const themeName = env.VITE_THEME
  const hexOverride = env.VITE_THEME_PRIMARY
  if (hexOverride) validateHex(hexOverride)
  if (themeName && !presets[themeName.toLowerCase()] && !hexOverride) {
    const keys = Object.keys(presets).join(', ')
    throw new Error(`[theme] Unknown VITE_THEME="${themeName}". Available: ${keys} or set VITE_THEME_PRIMARY="#rrggbb"`)
  }
  const resolved = resolvePreset(themeName, hexOverride)
  const scale = buildScale(resolved.primary)
  const vars = scaleToCssVars(scale)
  return { resolved, scale, vars, env }
}

function varsToStyleTag(vars) {
  const decls = Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')
  return `<style id="build-theme">:root{${decls}}</style>`
}

export default function buildThemePlugin(options = {}) {
  const envDir = options.envDir || process.cwd()
  let current = null

  return {
    name: 'vite-plugin-build-theme',

    config(_config, { mode }) {
      current = getThemeFromEnv(mode, envDir)
      // Expose for debugging; tailwind config reads vars, not this.
      return {
        define: {
          'import.meta.env.VITE_THEME': JSON.stringify(current.resolved.name),
          'import.meta.env.VITE_THEME_PRIMARY': JSON.stringify(current.resolved.primary),
        },
      }
    },

    transformIndexHtml(html) {
      if (!current) current = getThemeFromEnv('development', envDir)
      const tag = varsToStyleTag(current.vars)
      // Inject before </head> so it is before index.html flash script (index.html:14)
      // and before any CSS. No FOUC.
      if (html.includes('</head>')) {
        return html.replace('</head>', `${tag}</head>`)
      }
      return html.replace('<head>', `<head>${tag}`)
    },

    transform(code, id) {
      // Patch src/index.css fallback vars so the built CSS asset is baked even
      // without the Head inject (e.g., if html inject is stripped).
      if (!id.endsWith('src/index.css')) return null
      if (!current) return null
      let out = code
      // Replace each --primary-* declaration in :root block
      for (const [k, v] of Object.entries(current.vars)) {
        // k like --primary-color, --primary-hover, --primary-50
        const re = new RegExp(`${k}:\\s*#[0-9a-fA-F]{6}`, 'g')
        if (re.test(out)) {
          out = out.replace(new RegExp(`${k}:\\s*#[0-9a-fA-F]{6}`, 'g'), `${k}: ${v}`)
        } else {
          // If var not present in :root (e.g. --primary-50), inject inside :root { ... }
          // Insert before the closing } of :root
          out = out.replace(/(:root\s*\{[^}]*)(})/s, `$1  ${k}: ${v};\n$2`)
        }
      }
      if (out !== code) return out
      return null
    },

    configureServer(server) {
      // Hot-reload when .env or theme files change
      const themeFiles = ['.env', '.env.local', 'src/theme/presets.js', 'src/theme/scale.js']
      server.watcher.on('change', (file) => {
        if (themeFiles.some((f) => file.endsWith(f))) {
          // Vite loadEnv is cached per config; force full reload so new env is read
          server.ws.send({ type: 'full-reload', path: '*' })
        }
      })
    },
  }
}
