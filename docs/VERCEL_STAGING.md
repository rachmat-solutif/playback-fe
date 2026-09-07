# Vercel Staging - Playback FE (Free Hobby)

Staging deployment for `playback-fe` on **Vercel Hobby Free** using a **same-origin rewrite proxy** to `https://playback-be-staging.vercel.app`. This avoids the `vercel.app` Public Suffix cross-site cookie problem entirely - no `SameSite=None`, no BE CORS change, `SameSite=Lax` works.

> See also `docs/DEPLOYMENT.md` for general deploy options and `docs/API_INTEGRATION.md` for `VITE_API_BASE_URL` vs proxy.

## 1. Architecture

```
Browser: https://playback-fe-staging.vercel.app
  |
  |-- fetch("/api/conversations?...", { credentials: "include" })  --> same origin
  |-- fetch("/auth/me", { credentials: "include" })               --> same origin
  |-- fetch("/health")                                             --> same origin
  |-- GET /conversations/123 (hard refresh)                        --> same origin
  |
Vercel Edge (vercel.json rewrites)
  |-- /api/:path*  -> https://playback-be-staging.vercel.app/api/:path*
  |-- /auth/:path* -> https://playback-be-staging.vercel.app/auth/:path*
  |-- /health      -> https://playback-be-staging.vercel.app/health
  |-- /api/health  -> https://playback-be-staging.vercel.app/api/health
  |-- /(.*)        -> /index.html (SPA fallback for BrowserRouter)
  |
BE Staging: https://playback-be-staging.vercel.app (Fastify on Vercel Functions)
  |-- Atlas M0 / Azure Blob staging
  |-- Session cookie: SameSite=Lax; Secure; HttpOnly; Path=/ (host-only)
  |-- No CORS allowlist needed for FE - requests appear same-origin after proxy
```

**Why proxy:** Both `playback-fe-staging.vercel.app` and `playback-be-staging.vercel.app` are subdomains of `vercel.app`, which is on the Public Suffix List. Browsers treat them as **cross-site**. A direct `fetch("https://playback-be-staging.vercel.app/api/...", {credentials:"include"})` would require BE `SameSite=None; Secure` + `cors { origin: "https://playback-fe-staging.vercel.app", credentials: true }` and breaks on Safari. The proxy makes the browser see only one origin, so `Lax` works.

## 2. Prerequisites

* **Vercel account** Hobby Free, logged in with GitHub `rachmat-solutif` (org member with access to `rachmat-solutif/playback-fe`).
* **GitHub repo** `git@github-solutif:rachmat-solutif/playback-fe.git` branch `main` pushed (commit `03f46c3` or later, includes `vercel.json` at repo root).
* **BE staging deployed** `https://playback-be-staging.vercel.app` - verify before FE deploy:
  ```bash
  curl -i https://playback-be-staging.vercel.app/health
  # expect 200 { status: "ok" } or similar
  curl -i https://playback-be-staging.vercel.app/api/health
  # expect 200 if BE mounts health under /api, otherwise 404 is ok (guide proxies both)
  ```
  BE must set session cookie `sameSite: lax` or `lax` default is fine - do not set `Domain=vercel.app`.
* **Local tools:** Node `>=22` (see `.nvmrc` `24.19.0`), `npm ci` passes, `npm run build` produces `dist/` (vite `5.4.21`).

## 3. Step 1 - Verify Local Build and `vercel.json`

At repo root `~/Projects/playback-fe`:

```bash
# 1. Check vercel.json exists at repo root (same level as package.json)
ls -l vercel.json
cat vercel.json
# Must contain 5 rewrites: /api/:path*, /auth/:path*, /health, /api/health, /(.*) -> /index.html

# 2. Same-origin build for staging (VITE_API_BASE_URL empty)
VITE_API_BASE_URL="" npm run build
ls -lh dist/
# dist/index.html + dist/assets/

# 3. Optional local preview of the proxy behavior
# Vite dev proxy already mimics same-origin: src/lib/api.js uses /api when env empty
npm run dev
# open http://localhost:5173 -> login should hit Vite proxy /api -> localhost:3000
```

`src/lib/api.js:11` derives `API_BASE` from `VITE_API_BASE_URL`:
```js
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const BASE = API_BASE ? `${API_BASE}/api` : '/api'
export const AUTH_BASE = API_BASE ? `${API_BASE}/auth` : '/auth'
```
Empty `VITE_API_BASE_URL` -> `BASE=/api`, `AUTH_BASE=/auth` - exactly what the proxy expects.

`vite.config.js:13` local proxy and `vercel.json` rewrites share the same paths `/api`, `/auth`, `/health` so behavior is identical locally and on Vercel.

## 4. Step 2 - Create Vercel Project `playback-fe-staging`

1. Go `https://vercel.com/new` -> **Import Git Repository** -> select `rachmat-solutif/playback-fe` (if not listed, `Adjust GitHub App` to grant org access).
2. **Project Name:** `playback-fe-staging` (results in `https://playback-fe-staging.vercel.app` - check availability; Vercel may append hash if taken, use the assigned URL).
3. **Framework Preset:** `Vite` (auto-detected). Confirm:
   * Build Command: `npm run build`
   * Output Directory: `dist`
   * Install Command: `npm ci`
   * Node Version: `22.x` (Project Settings -> Node.js Version - must satisfy `package.json:27` `>=22`).
4. **Do not click Deploy yet** - add environment variables first (next step). If you already deployed, add vars then Redeploy.

Only `*.vercel.app` free domain is used for staging per this guide. No custom domain `staging.playback.rachmat.pro` is configured.

## 5. Step 3 - Environment Variables

In Vercel dashboard: Project `playback-fe-staging` -> **Settings -> Environment Variables**.

| Variable | Value | Environments | Notes |
|----------|-------|--------------|-------|
| `VITE_API_BASE_URL` | `""` (empty string) | Production, Preview, Development | Forces same-origin `/api` and `/auth` so rewrites proxy. Type empty string, not space. If field does not allow empty, leave unset - unset also yields `""` in `api.js:11`. |

Do **not** set `VITE_API_PROXY_TARGET` on Vercel - it is Vite dev only (`vite.config.js:14`).

After saving, **Redeploy** if you already deployed once: `Deployments -> ... -> Redeploy` with `Use existing Build Cache` unchecked so Vite rebakes env.

`VITE_API_BASE_URL` is baked at `vite build` time - changing it requires rebuild.

## 6. Step 4 - The `vercel.json` Rewrite Rules

File at `~/Projects/playback-fe/vercel.json` (committed to `main`):

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://playback-be-staging.vercel.app/api/:path*" },
    { "source": "/auth/:path*", "destination": "https://playback-be-staging.vercel.app/auth/:path*" },
    { "source": "/health", "destination": "https://playback-be-staging.vercel.app/health" },
    { "source": "/api/health", "destination": "https://playback-be-staging.vercel.app/api/health" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "cleanUrls": false
}
```

Rules:

* `/api/:path*` and `/auth/:path*` proxy all API and auth calls to BE staging, preserving path and query.
* `/health` and `/api/health` both proxied - BE may expose health at either path; proxying both is harmless, one may 404 if not mounted but does not affect SPA fallback because these specific sources are checked before generic.
* `/(.*) -> /index.html` SPA fallback for `BrowserRouter` (`src/main.jsx:9`). `src/App.jsx:17` routes `/`, `/login`, `/conversations`, `/conversations/:id`, `* -> /` all load `index.html`.
* `cleanUrls: false` - required. Vercel `cleanUrls: true` breaks `rewrites` destination `/index.html` (community report `stagelocate.com`).

Commit and push:

```bash
git add vercel.json
git commit -m "feat: vercel staging rewrite proxy to playback-be-staging"
git push origin main
# Vercel auto-deploys Production on push to main
```

## 7. Step 5 - Deploy and Smoke Test

### Production deployment (main branch)

* Push to `main` triggers **Production** deployment `https://playback-fe-staging.vercel.app`.
* Vercel `Deployments` tab -> latest -> `Building` -> `Ready`. Check Build Logs `vite v5.4.21 building for production... 56 modules transformed`.

### Preview deployments (PR branches)

* Any branch push or PR creates `https://playback-fe-staging-git-<branch>-<hash>.vercel.app` with same `vercel.json` proxy to the **same** BE staging `https://playback-be-staging.vercel.app`. Preview is useful for FE-only staging but shares BE staging data - do not use for prod BE.

### Manual verification (browser)

1. Open `https://playback-fe-staging.vercel.app/login` -> click `Sign in with Microsoft` -> Entra redirects to BE `https://playback-be-staging.vercel.app/auth/callback` -> BE sets cookie -> redirects to `https://playback-fe-staging.vercel.app/`.
2. DevTools `Application -> Cookies -> https://playback-fe-staging.vercel.app` should show `session` or `connect.sid` with `SameSite=Lax`, `Secure`, `HttpOnly`, `Path=/`, `Domain` empty (host-only) or `playback-fe-staging.vercel.app`. No `SameSite=None` needed.
3. Console on FE origin:
   ```js
   await fetch("/auth/me", { credentials: "include" }).then(r => r.json())
   // expect 200 { id, email, name } not 401

   await fetch("/api/conversations?page=1&limit=5", { credentials: "include" }).then(r => r.json())
   // expect { data: [...], total, page }

   await fetch("/health").then(r => r.json())
   // expect proxied { status: "ok" } from BE

   await fetch("/api/health").then(r => r.json())
   // expect proxied 200 or 404 if BE only mounts /health - either is ok
   ```
4. Hard refresh SPA fallback: open `https://playback-fe-staging.vercel.app/conversations/some-id` directly or refresh `F5`. Must return `200` `index.html` (check `Network -> Doc` status `200`, not `404`). If `404`, `vercel.json` fallback not deployed.

### cURL verification (no browser)

```bash
# FE root
curl -i https://playback-fe-staging.vercel.app/
# HTTP/2 200 content-type: text/html

# SPA fallback
curl -i https://playback-fe-staging.vercel.app/conversations/123
# HTTP/2 200 content-type: text/html (index.html)

# Proxied health
curl -i https://playback-fe-staging.vercel.app/health
# HTTP/2 200 proxied from BE

curl -i https://playback-fe-staging.vercel.app/api/health
# HTTP/2 200 or 404 depending on BE mount

# Proxied API (will 401 without session, but should not CORS error)
curl -i https://playback-fe-staging.vercel.app/api/conversations?limit=1
# HTTP/2 401 { error: "Unauthorized" } - correct, not CORS block
# Check no access-control-allow-origin header needed same-origin
```

## 8. Limits on Vercel Hobby Free (Staging Fit)

| Limit | Hobby | Staging Usage | Action if Hit |
|-------|-------|---------------|---------------|
| Projects | 200 | 1 (`playback-fe-staging`) + 1 BE (`playback-be-staging`) | Safe |
| Deployments per day / hour / 5 min | 100 / 100 / 60 per owner | ~3-5 pushes/day | Safe; 1-hour burst 100 protects PR spam |
| Concurrent deployments | 1 | Second push queues | Expect queue on parallel PRs |
| Build duration per deployment | 45 min | `vite build` ~2s | Safe |
| Static file upload | 100 MB | `dist/` <5 MB | Safe |
| Routes | 2048 | 5 rewrites | Safe |
| Bandwidth (Fast Data Transfer) | 100 GB / month | SPA 245 kB gz JS ~80k pageviews | Email at 80/100%, pause at cap until next 30-day cycle - Hobby cannot buy overage |
| Domains per project | 50 | 1 (`*.vercel.app`) | No custom domain in this guide |

Hobby is **personal/non-commercial only** per Vercel ToS. Staging for internal business testing technically requires Pro. Enforcement is flag-by-email, not immediate block - consider Pro if staging is business-critical.

## 9. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `401` on `/auth/me` after login, no cookie in DevTools | `VITE_API_BASE_URL` not empty - FE still calls `https://playback-be-staging.vercel.app` cross-site, cookie `Lax` dropped | Set `VITE_API_BASE_URL=""` in Vercel env for all envs, Redeploy (uncached) |
| `CORS blocked: No Access-Control-Allow-Origin` | Direct cross-site fetch bypassing proxy (env not empty or code uses absolute URL) | Ensure `src/lib/api.js:11` uses `BASE=/api`, not `https://...` |
| `404` on refresh `/conversations/123` | `vercel.json` not deployed or `cleanUrls: true` or fallback last | Confirm `vercel.json` at repo root committed, `cleanUrls:false`, Deployments -> Source shows `vercel.json` |
| `502 Bad Gateway` on `/api/*` | `https://playback-be-staging.vercel.app` not reachable or missing Function | `curl -i https://playback-be-staging.vercel.app/health` must 200; check BE project Deployments |
| Cookie `SameSite=None` still set | BE still forces `sameSite: none` for `vercel.app` origin | Keep BE `sameSite: lax` (or default) for host-only staging; proxy makes `None` unnecessary |
| Preview deployment shows prod data | Preview shares same `BE_STAGING_HOST` | Expected - guide proxies all envs to same BE staging; for per-branch BE create per-branch env var |

## 10. Relationship to Other Deploys

* **Local dev:** `vite.config.js:13` proxy `VITE_API_PROXY_TARGET || http://localhost:3000` - same paths, same-origin `/api` - no `vercel.json` involved.
* **Production BE on GCP:** `https://api.playback.rachmat.pro` stays separate. To stage prod BE via Vercel FE, change `vercel.json` destinations to `https://api.playback.rachmat.pro` and redeploy - same proxy pattern.
* **Direct cross-site (no proxy):** Documented in `docs/DEPLOYMENT.md` CORS/cookies section - requires BE `sameSite: none; secure: true` + `cors origin` - not used for this staging.

## 11. Next Steps After Staging

1. Promote same `vercel.json` to production FE if FE will stay `*.vercel.app`: create `playback-fe` Production project pointing to `https://playback-be.vercel.app` (prod BE) with `VITE_API_BASE_URL=""`.
2. Or keep production FE on GCP Caddy `playback.rachmat.pro` (`docs/DEPLOYMENT.md` Option C) and keep `vercel.json` staging-only.
3. Add Vercel `Git -> Ignored Build Step` if needed to skip builds for doc-only commits.
