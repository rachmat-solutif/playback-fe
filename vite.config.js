import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import buildTheme from './src/plugins/vite-plugin-build-theme.js'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:3000'

  return {
    plugins: [react(), buildTheme()],
    server: {
      port: 5173,
      host: true,
      // Dev proxy keeps the browser on a single origin (localhost:5173) so the
      // session cookie and auth work without CORS when the backend runs locally
      // on port 3000. Override with VITE_API_PROXY_TARGET for remote BE.
      proxy: {
        '/api': proxyTarget,
        '/auth': proxyTarget,
        '/health': proxyTarget,
      },
    },
    preview: {
      host: '127.0.0.1',
      port: 8090,
      strictPort: true,
      allowedHosts: ['playback.rachmat.pro', 'localhost', '127.0.0.1'],
    },
  }
})
