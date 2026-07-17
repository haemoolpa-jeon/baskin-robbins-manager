import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  plugins: [
    react(),
    VitePWA({
      // autoUpdate: the service worker takes over and refreshes silently when a
      // new build is deployed — this is what fixes the legacy "stuck br-v1 cache".
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'BR 재고 매니저',
        short_name: 'BR재고',
        description: '아이스크림, 케이크, 디저트, 소모품 재고 관리 앱',
        lang: 'ko',
        start_url: '/',
        display: 'standalone',
        background_color: '#fff5f8',
        theme_color: '#ff1493',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Network-first for the Supabase API so data is always fresh when online,
        // but the app shell stays available offline.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co'),
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-api', networkTimeoutSeconds: 5 },
          },
        ],
      },
    }),
  ],
})
