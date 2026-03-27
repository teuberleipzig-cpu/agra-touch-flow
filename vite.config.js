import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
  ],

  // Für GitHub Pages: Repo-Name als base path
  // Wenn die Seite später auf eigene Domain kommt → diese Zeile entfernen
  base: '/agra-touch-flow/',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    proxy: {
      // Dev proxy: nur lokal aktiv, wird im Build ignoriert
      '/api/agra-events': {
        target: 'https://agramessepark.de',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/agra-events/, '/wp-json/tribe/events/v1/events'),
        secure: true,
      },
    },
  },
})
