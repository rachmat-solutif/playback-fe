/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand palette (crimson). Scale mapped so existing primary-50/100/500/600/700
        // classes keep working; 50/100 are the secondary-hover/press tints.
        primary: {
          50: '#fdf4f6', // secondary-hover
          100: '#f8dbe3', // secondary-press
          200: '#f3bccb',
          300: '#e88ba5',
          400: '#dd4f74',
          500: '#d31145', // primary-color
          600: '#b40e3a', // primary-hover
          700: '#940b30', // primary-focus
          800: '#7a0a2a',
          900: '#5f0821',
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
