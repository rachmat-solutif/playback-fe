# Playback FE

Frontend SPA for **Playback** - database of customer service conversations: searching, filtering, and playing back call audio.

> Split from the `playback` monolith. Backend lives in `playback-be` and runs as a separate service/repo. This repo is UI-only: no Fastify, MongoDB, or Azure code.

## Tech Stack

- **Vite 5** - build tool / dev server
- **React 18** - function components + hooks only, no class components
- **React Router 6** - client-side routing
- **Tailwind CSS 3** - utility-first styling with CSS variables for light/dark themes
- **Howler.js** - audio playback (via `src/hooks/useAudioPlayer.js`)
- **No external state library** - shared state in React Context (`AuthContext`, `ThemeContext`) and URL query params (`useConversationFilters`, `useDateRangeFilter`)

## Project Structure

```
playback-fe/
|-- index.html                 # Vite entry + theme flash prevention
|-- vite.config.js             # Dev proxy (/api,/auth,/health -> BE)
|-- tailwind.config.js         # Brand palette + semantic surface tokens
|-- postcss.config.js
|-- public/
|   |-- favicon.svg
|   `-- audio/                 # Sample audio files (local dev fallback)
|-- src/
|   |-- main.jsx               # ReactDOM + BrowserRouter
|   |-- App.jsx                # Route definitions (ProtectedRoute + Layout)
|   |-- index.css              # Tailwind directives + CSS variables (:root / .dark)
|   |-- components/            # Reusable UI (15 components)
|   |   |-- AudioPlayer.jsx    # play/pause, +/-10s, scrubber, accessible
|   |   |-- ConversationTable.jsx
|   |   |-- ContactVolumeChart.jsx
|   |   |-- SearchBar.jsx
|   |   |-- Layout.jsx
|   |   |-- ProtectedRoute.jsx
|   |   `-- ...
|   |-- routes/                # Page components
|   |   |-- Login.jsx          # Redirects to /auth/login (Entra)
|   |   |-- Dashboard.jsx      # (legacy, now merged into ConversationSearch)
|   |   |-- ConversationSearch.jsx  # Filter + table + pagination
|   |   `-- ConversationDetail.jsx  # Detail + transcript + audio
|   |-- context/
|   |   |-- AuthContext.jsx    # Session auth (GET /auth/me, login/logout)
|   |   `-- ThemeContext.jsx   # light/dark toggle + system preference
|   |-- hooks/
|   |   |-- useAudioPlayer.js
|   |   |-- useConversationFilters.js  # URL-synced filters + fetchConversations
|   |   `-- useDateRangeFilter.js
|   |-- lib/
|   |   |-- api.js             # fetch wrapper (fetchConversations, fetchAudioUrl, etc.)
|   |   |-- constants.js
|   |   |-- formatters.js
|   |   `-- cookies.js
|   `-- data/                  # Legacy mock data (not imported in prod)
|-- docs/                      # Frontend docs (HLD, frontend guide, deployment)
`-- Dockerfile                 # Multi-stage nginx build for production
```

Backend-only paths (`src/server`, `scripts`, `infra-gcloud`, `docker-compose.dev.yml`, `vitest.server.config.ts`) are intentionally **not** in this repo.

## Prerequisites

- Node.js `>=22` (see `.nvmrc` - `24.19.0`)
- Backend API running - `playback-be` on `http://localhost:3000` or a remote URL via `VITE_API_BASE_URL`

No Docker or MongoDB required for frontend-only development (mock fallback in `src/data` exists but the app fetches from the live API).

## Quick Start

```bash
# 1. Install
npm install

# 2. Configure env (optional for local dev)
cp .env.example .env.local
# .env.local:
#   VITE_API_BASE_URL=   # empty = same-origin via Vite proxy (recommended)

# 3. Run dev server (requires playback-be on port 3000)
npm run dev
# -> http://localhost:5173
#    Vite proxies /api, /auth, /health to http://localhost:3000
#    Session cookie works with no CORS setup

# 4. Build for production
npm run build
# -> dist/

# 5. Preview production build
npm run preview
# -> http://127.0.0.1:8090
```

### With a remote backend (split deployment)

```bash
# Point FE directly at the BE (no proxy)
echo 'VITE_API_BASE_URL=https://api.playback.rachmat.pro' > .env.local
npm run dev   # or npm run build for deployed artifact
```

`VITE_API_BASE_URL` is baked at build time (Vite `import.meta.env`). For split origins, the BE must allow the FE origin via CORS with `credentials: include` and the session cookie must be `sameSite: none` + `secure: true` (already set in `staging`/`production`).

## Environment

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `VITE_API_BASE_URL` | - | `""` (same-origin) | Backend origin, e.g. `http://localhost:3000` or `https://api.playback.rachmat.pro`. No trailing slash. When empty, all `/api` and `/auth` calls go through the Vite proxy |
| `VITE_API_PROXY_TARGET` | - | `http://localhost:3000` | Dev proxy target override (e.g. staging BE) |

All other env (Mongo, Entra, Azure) lives in `playback-be`.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite HMR on port 5173 with proxy to BE |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build on port 8090 |

## Routes

| Path | Access | Component | Description |
|------|--------|-----------|-------------|
| `/login` | public | `Login.jsx` | Entra ID sign-in (redirects to `/auth/login`) |
| `/` | protected | `ConversationSearch.jsx` | Search and browse conversations (also `/conversations`) |
| `/conversations/:id` | protected | `ConversationDetail.jsx` | Conversation detail + transcript + audio |
| `*` | - | `Navigate -> /` | Unknown paths redirect to dashboard (which bounces to `/login` when signed out) |

Protected routes are gated by `ProtectedRoute` + `AuthContext` (`GET /auth/me` with `credentials: include`).

## API Integration

All data comes from `playback-be` via `src/lib/api.js`:

| Function | Endpoint | Notes |
|----------|----------|-------|
| `fetchConversations(params)` | `GET /api/conversations?from&to&agent&channel&sentiment&tag&keyword&minDuration&page&limit` | Paginated, AND filter logic, server-side |
| `fetchConversation(id)` | `GET /api/conversations/:id` | Full detail with agent, customer, tags, transcript, audio, metrics |
| `fetchAnalytics(type, params)` | `GET /api/analytics/volume\|kpis\|sentiment\|top-agents` | Volume supports `granularity=day\|hour` |
| `fetchAudioUrl(conversationId)` | `GET /api/audio/:conversationId` | Returns SAS URL (Azure) or streamed path (local); `null` on 404 |
| `fetchAgents()` | `GET /api/agents` | Sorted alphabetically |

Auth via `src/context/AuthContext.jsx`:

- `GET /auth/me` - session check (with `credentials: include`)
- `GET /auth/login` - Entra ID login redirect
- `GET /auth/logout` - destroy session + Microsoft logout

The API wrapper always sends `credentials: include` so the HTTP-only session cookie is included on cross-origin requests after the split. See `docs/API_INTEGRATION.md`.

## Features

### Search and Filtering

Advanced filtering by keyword (transcript, customer, agent, topic), agent (autocomplete via `fetchAgents`), channel, sentiment, from-date, and minimum duration. Filters combine with AND logic, are synced to URL query params, and are shareable/bookmarkable. Pagination is server-side.

### Conversation Detail + Playback

- `AudioPlayer` - play/pause, +/-10s skip, scrubber, timestamps; keyboard-operable and `aria-label`d.
- Chat-style transcript - clicking a line's timestamp seeks the audio to that point (via `useAudioPlayer`).

### Dashboard Panels

- Date range filter as primary scope control (URL-synced `?from=&to=`, defaults to last 30 days) - see `useDateRangeFilter`.
- KPI cards, contact volume chart (By Day / By Hour, stacked by channel), and top-agents panel - all react to the shared date range via `fetchAnalytics`.

## Deployment (Split from BE)

The original monolith served `dist/` from Fastify via `@fastify/static`. After the split:

- **FE** is a static site: `npm run build` -> `dist/` -> deploy to Vercel, Netlify, GCP Cloud Storage, or any nginx/Caddy.
- **BE** is `playback-be` (Fastify on port 3000, own VM/container).

```
BE:  api.playback.rachmat.pro  -> Fastify (port 3000) -> Atlas M0 / Azure Blob
FE:  playback.rachmat.pro      -> Static (Vite build) -> calls BE via VITE_API_BASE_URL
```

**Docker (FE-only):**

```bash
docker build --build-arg VITE_API_BASE_URL=https://api.playback.rachmat.pro -t playback-fe .
docker run -p 80:80 playback-fe
```

**CORS & cookies for split origins:**

- BE must add `@fastify/cors` with `origin: ["https://playback.rachmat.pro"]` and `credentials: true`.
- FE `api.js` and `AuthContext.jsx` already send `credentials: include`.
- Session cookie must be `sameSite: none` + `secure: true` (set in staging/production). Ensure HTTPS on both sides.

See `docs/DEPLOYMENT.md` for Vercel, nginx, and Caddy examples.

## Docs

| Doc | Contents |
|-----|----------|
| `docs/HIGH-LEVEL-DESIGN.md` | System architecture and data flow (shared with BE) |
| `docs/FRONTEND_GUIDE.md` | Components, hooks, context, styling, conventions |
| `docs/API_INTEGRATION.md` | API client, auth flow, proxy vs `VITE_API_BASE_URL` |
| `docs/DEPLOYMENT.md` | Split deployment: Vercel, nginx, Docker, CORS/cookies |
