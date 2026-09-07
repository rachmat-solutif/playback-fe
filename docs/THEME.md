# Theme - Playback FE

Build-time brand theme via `VITE_THEME` preset name or `VITE_THEME_PRIMARY` hex. **Zero runtime cost** - baked by `vite-plugin-build-theme` at `vite build` and hot-reloaded in `vite dev`. Dark mode follows the same primary (no separate dark palette).

> Plugin: `src/plugins/vite-plugin-build-theme.js` | Presets: `src/theme/presets.js` | Scale: `src/theme/scale.js` | Wiring: `vite.config.js` + `tailwind.config.js` + `src/index.css`

## How It Works

1. `src/theme/presets.js` defines 20 human-language presets, each a single `primary` hex.
2. `src/theme/scale.js` derives `primary 50..900` scale from that hex via `colord` (50 lighten 48%, 600 darken 12%, 700 darken 24%, etc.).
3. `vite-plugin-build-theme` at `config` reads `loadEnv` (`VITE_THEME` / `VITE_THEME_PRIMARY`), validates hex, builds scale, then:
   * `transformIndexHtml` injects `<style id="build-theme">:root{--primary-color:#...;--primary-hover:#...;...}</style>` into `<head>` before `index.html:14` flash script - no FOUC.
   * `transform` patches `src/index.css:6` fallback vars so `dist/assets/*.css` is baked.
   * `tailwind.config.js:10` `primary: {500:'var(--primary-color)', 600:'var(--primary-hover)', ...}` resolves via vars - `bg-primary-500` is `var(--primary-color)` at paint (`0-1ms` var resolve, `+~300B` gzipped, no JS).
4. Light/dark toggle (`src/context/ThemeContext.jsx`, `index.html:14` cookie) unchanged - surfaces `var(--canvas)` flip via `.dark`, primary vars stay same in both.

Changing theme requires **rebuild** for production. In dev, changing `.env` or `presets.js` triggers `full-reload` hot-reload.

## Presets (20)

| Preset | `VITE_THEME=` | Primary `500` | Label |
|--------|---------------|---------------|-------|
| crimson | `crimson` | `#d31145` | Crimson (default) |
| ocean | `ocean` | `#0a7bc2` | Ocean Blue |
| forest | `forest` | `#0e7a4b` | Forest Green |
| sunset | `sunset` | `#e85d04` | Sunset Orange |
| violet | `violet` | `#6d28d9` | Violet |
| slate | `slate` | `#334155` | Slate |
| teal | `teal` | `#0d9488` | Teal |
| midnight | `midnight` | `#1e293b` | Midnight Navy |
| coral | `coral` | `#e76f51` | Coral |
| amber | `amber` | `#d97706` | Amber |
| emerald | `emerald` | `#059669` | Emerald |
| sapphire | `sapphire` | `#1d4ed8` | Sapphire |
| ruby | `ruby` | `#be123c` | Ruby |
| lavender | `lavender` | `#7c3aed` | Lavender |
| charcoal | `charcoal` | `#27272a` | Charcoal |
| mint | `mint` | `#10b981` | Mint |
| blush | `blush` | `#db2777` | Blush Rose |
| indigo | `indigo` | `#4338ca` | Indigo |
| copper | `copper` | `#b45309` | Copper |
| arctic | `arctic` | `#0891b2` | Arctic Sky |

Add more by editing `src/theme/presets.js` - no plugin change.

## Usage

```bash
# List presets
grep -E "^\s+\w+:" src/theme/presets.js

# Dev - try and choose per client (hot-reload)
VITE_THEME=ocean npm run dev      # http://localhost:5173
VITE_THEME=forest npm run dev
VITE_THEME=emerald npm run dev
# ad-hoc hex overrides preset
VITE_THEME_PRIMARY=#ff6600 npm run dev

# Also via .env.local
echo 'VITE_THEME=ocean' > .env.local
npm run dev  # change .env.local -> browser full-reload automatically

# Production - rebuild per client
VITE_THEME=ocean npm run build      # dist/ for client A
VITE_THEME=forest npm run build     # dist/ for client B
VITE_THEME_PRIMARY=#0a7bc2 npm run build  # custom hex

# Vercel - Project Settings -> Environment Variables
# VITE_THEME = ocean (Production/Preview/Development) -> Redeploy

# Docker per client
docker build --build-arg VITE_THEME=sunset -t playback-fe:sunset .
docker build --build-arg VITE_THEME_PRIMARY=#6d28d9 -t playback-fe:violet .
docker build --build-arg VITE_THEME=emerald --build-arg VITE_API_BASE_URL=https://api.playback.rachmat.pro -t playback-fe:emerald .
```

`VITE_THEME_PRIMARY` takes precedence over `VITE_THEME`. Unknown `VITE_THEME` fails build with `Available: crimson, ocean, ...`.

## Verification

```bash
# Build crimson (default)
npm run build
grep -o "build-theme.*--primary-color" dist/index.html
grep "primary-color" dist/assets/*.css | head

# Build ocean
VITE_THEME=ocean npm run build
grep "build-theme" dist/index.html  # should contain #0a7bc2
grep "#d31145" dist/assets/*.css || echo "crimson not in css - good"

# Build custom hex
VITE_THEME_PRIMARY=#ff6600 npm run build
grep "#ff6600" dist/index.html
```

* `dist/index.html` must contain `<style id="build-theme">:root{--primary-color:#...` with the chosen hex.
* `dist/assets/*.css` must contain `var(--primary-color)` not hardcoded `#d31145` when non-crimson (Tailwind `primary` is `var()`).
* Toggle `ThemeToggle.jsx` light/dark - surfaces flip, primary stays ocean/forest etc.

## Performance

* **FCP:** `0-1ms` CSS var resolve (single recalc on `.dark` toggle), same as before. No extra JS, no `fetch`.
* **CSS size:** `+~300B` gzipped for 10 vars (`--primary-50`..`--primary-900`).
* **JS size:** `0` - plugin is build-only (`src/plugins/` not shipped), `colord` is dev-only scale derivation, not in bundle.
* Lighthouse/CWV unchanged.

## Adding a New Theme

Edit `src/theme/presets.js`:

```js
export const presets = {
  // ...
  aurora: { primary: '#0ea5e9', label: 'Aurora' },
}
```

Then `VITE_THEME=aurora npm run dev`.

## Relationship to Other Docs

* `docs/FRONTEND_GUIDE.md` - components use `bg-primary-500`, `text-primary-600` etc. - now resolve via vars, no component change needed.
* `docs/DEPLOYMENT.md` - per-client Docker/Vercel builds use `VITE_THEME` alongside `VITE_API_BASE_URL`.
* `docs/VERCEL_STAGING.md` - staging proxy unaffected, set `VITE_THEME` per Vercel project.
