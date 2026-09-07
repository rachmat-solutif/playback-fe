# Frontend Guide - Playback FE

Detailed reference for the React SPA in `playback-fe`.

## Conventions

- Functional components + hooks only (no class components).
- Frontend in JSX (no TypeScript), backend in TypeScript (strict).
- Co-locate small state with the component that needs it; lift to Context only when shared across routes (`AuthContext`, `ThemeContext`).
- No `console.log` left in committed code.
- Prefer named exports for components except the default route component per file.
- Tailwind utility classes directly in JSX; extract to a component when a class combo repeats 3+ times.
- `VITE_` env vars are the only ones exposed to the client bundle.

## Entry Points

- `index.html` - loads `src/main.jsx`, includes a blocking script that reads `theme` cookie / `prefers-color-scheme` and adds `dark` class before paint to avoid FOUC.
- `src/main.jsx` - `ReactDOM.createRoot` + `BrowserRouter`.
- `src/App.jsx` - central route table: `/login` public, `/` and `/conversations*` protected via `ProtectedRoute` + `Layout`.

## Routing

- `/login` - `Login.jsx`: a static page with a button that does `window.location.href = AUTH_BASE + '/login'` (server-side Entra flow). No form state.
- `/` and `/conversations` - `ConversationSearch.jsx`: filter bar + table + pagination. All filter state in URL via `useConversationFilters`.
- `/conversations/:id` - `ConversationDetail.jsx`: fetches `fetchConversation(id)` + `fetchAudioUrl(id)` in parallel; renders `AudioPlayer` + chat transcript.
- `*` - `Navigate to="/"`.

## State and Data

### URL-synced filters

- `src/hooks/useConversationFilters.js` - reads/writes `window.location.search` via `react-router-dom` `useSearchParams`. Every filter change pushes a new URL so views are shareable. Calls `fetchConversations(params)` on change with debounce where appropriate.
- `src/hooks/useDateRangeFilter.js` - date range as `?from=YYYY-MM-DD&to=YYYY-MM-DD`, defaults to last 30 days. Used by dashboard panels.

### Auth

- `src/context/AuthContext.jsx` - on mount `fetch(AUTH_BASE + '/me', { credentials: 'include' })`. Exposes `{ isAuthenticated, user, username, loading, login, logout }`. `login`/`logout` are redirects to `AUTH_BASE + '/login'` and `'/logout'`.
- `AUTH_BASE` is derived from `VITE_API_BASE_URL` (empty = same-origin `/auth` via proxy). Always `credentials: include`.

### Theme

- `src/context/ThemeContext.jsx` - reads/writes `theme` cookie + `localStorage`, toggles `document.documentElement.classList('dark')`, listens to `prefers-color-scheme`. `ThemeToggle.jsx` is the UI.

### Audio

- `src/hooks/useAudioPlayer.js` - wraps `Howler` (or native `<audio>`) with `play/pause/seek/skip` and scrubber state. Used by `AudioPlayer.jsx` and `ConversationDetail.jsx` (click transcript timestamp -> seek).
- `src/lib/api.js` `fetchAudioUrl(id)` - fetches `GET /api/audio/:id`. If response is `application/json` returns `{url}` (Azure SAS URL), otherwise returns the streaming path (`/api/audio/:id`) for local dev.

## Components

| Component | Purpose |
|-----------|---------|
| `AudioPlayer.jsx` | Controls: play/pause, +/-10s, range scrubber, timestamps. `aria-label` on all controls; keyboard-operable |
| `ConversationTable.jsx` | Sortable table of conversations; links to `/conversations/:id` |
| `ContactVolumeChart.jsx` | Stacked bar chart by channel (call/chat/email) via `fetchAnalytics('volume')` |
| `DateRangeFilter.jsx` / `DateRangePicker.jsx` | Date range UI bound to `useDateRangeFilter` |
| `SearchBar.jsx` | Keyword + agent autocomplete (`fetchAgents`) + channel/sentiment filters + clear |
| `ChannelBadge.jsx` / `SentimentBadge.jsx` / `StatCard.jsx` | Presentational tiles/badges |
| `Layout.jsx` | App shell: header, nav, `ThemeToggle`, `Outlet` |
| `ProtectedRoute.jsx` | Guards protected routes; redirects to `AUTH_BASE/login` when `!isAuthenticated` |
| `Pagination.jsx` / `ScrollToTopButton.jsx` / `Autocomplete.jsx` | Utilities |

## Styling

- `src/index.css` - Tailwind base/components/utilities + CSS variables for semantic tokens (`--canvas`, `--surface`, `--text-strong`, etc.) flipped via `:root` and `.dark`.
- `tailwind.config.js` - brand palette `primary` (crimson scale `#d31145`), `tab`, `card`, and semantic `canvas/surface/line/strong/body/muted/faint` that map to `var(--...)`.
- Use semantic tokens (`bg-surface`, `text-strong`, `border-line`) over raw colors so dark mode is automatic.

## API Client

`src/lib/api.js`:

```js
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const BASE = API_BASE ? `${API_BASE}/api` : '/api'
```

- All `fetch` calls include `credentials: 'include'`.
- Query params are built via `URLSearchParams`; empty values are omitted.
- Errors throw `Error(body.error || statusText)` for the UI to display.

See `docs/API_INTEGRATION.md`.

## Accessibility

- Audio controls must have `aria-label` and be keyboard-operable.
- Sufficient color contrast for status/sentiment badges (check against Tailwind tokens).
- Form inputs (search, date range) need associated `<label>`s.

## Legacy `src/data/`

`src/data/conversations.js` and `analytics.js` are the pre-backend mock datasets. They are no longer imported by any route - kept for reference and local offline fallback.

## Testing the UI

No unit tests are in this repo (backend tests live in `playback-be`). Manual verification:

- `npm run dev` with `playback-be` running: open `http://localhost:5173`, sign in (or `AUTH_BYPASS=true` on BE), search, paginate, open detail, play audio, toggle theme.
- With `VITE_API_BASE_URL=https://api.playback.rachmat.pro`: verify `fetch('/auth/me')` goes cross-origin with cookies and CORS headers.
