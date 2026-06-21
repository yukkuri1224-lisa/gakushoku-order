import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// PWA + SPA 構成。Framework Preset = Vite（Vercel が自動認識）。出力は dist。
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: '学食モバイルオーダー',
        short_name: '学食オーダー',
        description: '学食のモバイルオーダー（デモ）',
        theme_color: '#ff7a00',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    // import エイリアス @/ -> src（tsconfig.json の paths と必ず両方そろえる）
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
