# Deployment - Playback FE

Split deployment: FE is a static site, BE is `playback-be` on its own VM/container. This doc covers FE deploys.

## Build

```bash
npm ci
VITE_API_BASE_URL=https://api.playback.rachmat.pro npm run build
# -> dist/ (index.html + assets/)
```

`VITE_API_BASE_URL` is baked at build time. For same-origin proxy builds (local) leave it empty.

## Option A: Vercel / Netlify / Cloudflare Pages

- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://api.playback.rachmat.pro`
- SPA fallback: all routes serve `index.html` (Vercel `vercel.json` -> `rewrites: [{ source: "/(.*)", destination: "/index.html" }]`; Netlify `_redirects` -> `/* /index.html 200`)

No serverless function needed - FE is purely static.

## Option B: Docker + nginx (any VM)

`Dockerfile` in this repo:

```dockerfile
FROM node:22-alpine AS build
# ... npm ci, build, ARG VITE_API_BASE_URL
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# try_files $uri /index.html for SPA fallback
```

```bash
docker build --build-arg VITE_API_BASE_URL=https://api.playback.rachmat.pro -t playback-fe .
docker run -p 80:80 playback-fe
```

## Option C: GCP VM with Caddy (same VM as BE, different vhost)

The original monolith used Caddy to reverse-proxy to `localhost:3000`. After split, FE can be served as static files alongside the BE:

```
playback.rachmat.pro      -> Caddy -> file_server dist/ (FE)
api.playback.rachmat.pro  -> Caddy -> reverse_proxy localhost:3000 (BE)
```

Example `Caddyfile`:

```
playback.rachmat.pro {
  root * /srv/playback-fe/dist
  file_server
  try_files {path} /index.html
}

api.playback.rachmat.pro {
  reverse_proxy localhost:3000
}
```

Or keep FE on Vercel and BE on the GCP VM - just set `VITE_API_BASE_URL` to the BE origin.

## CORS and Cookies (split origins)

When FE and BE are on different origins, BE must allow the FE origin:

```ts
// playback-be/src/server/app.ts
import cors from '@fastify/cors'
await app.register(cors, {
  origin: ['https://playback.rachmat.pro', 'http://localhost:5173'],
  credentials: true,
})
```

FE already sends `credentials: 'include'` (`api.js`, `AuthContext.jsx`).

Session cookie:

- Local (same-origin proxy): `sameSite: lax`, `secure: false` is fine.
- Staging/production (cross-site): `sameSite: none` + `secure: true`, HTTPS required. Already configured in `playback-be` when `NODE_ENV` is `staging`/`production`.

Also set `ENTRA_REDIRECT_URI` to the FE-aware callback (e.g. `https://api.playback.rachmat.pro/auth/callback` - BE handles it, then redirects to FE).

## Environment

| Variable | Where | Example |
|----------|-------|---------|
| `VITE_API_BASE_URL` | FE build | `https://api.playback.rachmat.pro` or `""` |
| `VITE_API_PROXY_TARGET` | FE dev only | `http://localhost:3000` or staging BE URL |
| `ENTRA_REDIRECT_URI` | BE | `https://api.playback.rachmat.pro/auth/callback` |
| `APP_ORIGINS` / CORS | BE | `https://playback.rachmat.pro` |

## Verifying a deployment

```bash
curl https://api.playback.rachmat.pro/health
# -> {"status":"ok"}

# FE
curl -I https://playback.rachmat.pro/
# -> 200, content-type text/html

# Cross-origin auth check from browser console on FE origin:
fetch('https://api.playback.rachmat.pro/auth/me', { credentials: 'include' })
```

If `401` on `/auth/me`, check session cookie (`Set-Cookie: ...; SameSite=None; Secure`) and that BE `cors.origin` includes the FE origin.

## Relationship to playback-be

- `playback-be` repo: Fastify API, MongoDB, Azure Blob, Entra. See its `README.md` and `infra-gcloud/` for BE infra.
- `playback-fe` repo: this repo. No `infra-gcloud/` - FE infra is the static host (Vercel/nginx/Caddy file_server).
- Source monolith archived at `~/Projects/playback`.
