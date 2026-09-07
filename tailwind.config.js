/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand palette - values are CSS variables baked by vite-plugin-build-theme
        // from VITE_THEME / VITE_THEME_PRIMARY (src/theme/presets.js + scale.js).
        // Fallbacks below are crimson defaults; plugin overwrites :root vars at build/dev.
        primary: {
          50: 'var(--primary-50)',
          100: 'var(--primary-100)',
          200: 'var(--primary-200)',
          300: 'var(--primary-300)',
          400: 'var(--primary-400)',
          500: 'var(--primary-color)',
          600: 'var(--primary-hover)',
          700: 'var(--primary-focus)',
          800: 'var(--primary-800)',
          900: 'var(--primary-900)',
        },
        // Tab accents (used by segmented toggles).
        tab: {
          hover: '#5699c1',
          active: '#1f78ad',
        },
        // Colored card backgrounds (dashboard KPI tiles).
        card: {
          one: '#a10354',
          two: '#db406a',
          three: '#ce425c',
        },
        // Status / sentiment indicators.
        success: '#16a34a',
        warning: '#d97706',
        error: '#dc2626',

        // Semantic surface/text tokens - values flip between light and dark via
        // CSS variables defined in index.css (:root and .dark).
        canvas: 'var(--canvas)',
        surface: 'var(--surface)',
        'surface-muted': 'var(--surface-muted)',
        line: 'var(--border-color)',
        strong: 'var(--text-strong)',
        body: 'var(--text-body)',
        muted: 'var(--text-muted)',
        faint: 'var(--text-faint)',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
