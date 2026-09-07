/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_API_PROXY_TARGET?: string
  readonly VITE_THEME?: string
  readonly VITE_THEME_PRIMARY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
