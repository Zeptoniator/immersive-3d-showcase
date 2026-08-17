/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Configuration Vite.
 *
 * `base` est pilotable par la variable d'environnement `VITE_BASE_PATH` afin de
 * couvrir aussi bien un hébergement à la racine (Vercel, Netlify, Cloudflare
 * Pages, Nginx) qu'un sous-chemin (GitHub Pages : `/immersive-3d-showcase/`).
 */
export default defineConfig(({ mode }) => ({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: mode !== 'production',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Three.js est volumineux et change rarement : on l'isole dans son
        // propre fragment pour qu'il reste en cache entre deux déploiements.
        manualChunks(id: string) {
          if (id.includes('node_modules/three/')) return 'three'
          if (id.includes('node_modules/gsap/')) return 'gsap'
          return undefined
        },
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    css: false,
    restoreMocks: true,
  },
}))
