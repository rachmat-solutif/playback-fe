import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // Dev proxy keeps the browser on a single origin (localhost:5173) so the
    // session cookie and auth work without CORS when the backend runs locally
    // on port 3000. Override with VITE_API_PROXY_TARGET for remote BE.
    proxy: {
      '/api': process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
      '/auth': process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
      '/health': process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 8090,
    strictPort: true,
    allowedHosts: ['playback.rachmat.pro', 'localhost', '127.0.0.1'],
  },
})
