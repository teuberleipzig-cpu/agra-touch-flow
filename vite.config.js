import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],

  resolve: {
    alias: {
      // Replaces the implicit alias that @base44/vite-plugin previously injected
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    proxy: {
      // Dev proxy: /api/agra-events → agramessepark.de REST API
      // Bypasses CORS in development.
      // In production, Nginx on your server handles this same rewrite.
      '/api/agra-events': {
        target: 'https://agramessepark.de',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/agra-events/, '/wp-json/tribe/events/v1/events'),
        secure: true,
      },
    },
  },
})