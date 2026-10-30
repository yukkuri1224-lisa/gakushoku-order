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
      // 登録は src/main.tsx の registerSW で行う（新しい版が来たら自動で読み込み直す）。
      // virtual:pwa-register を読み込むと 'auto' でも登録用のスクリプトは差し込まれない。
      // ※false にすると skipWaiting / clientsClaim が付かず、新しい版が待機したまま残る
      injectRegister: 'auto',
      workbox: {
        skipWaiting: true, // 新しい版をすぐ有効にする
        clientsClaim: true, // 開いている画面もすぐ新しい版の管理下に置く
      },
      includeAssets: [
        'favicon.svg',
        'favicon-32.png',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
      ],
      manifest: {
        name: 'LiSA校食堂 モバイルオーダー',
        short_name: '学食オーダー',
        description: 'LiSA校食堂のモバイルオーダー',
        theme_color: '#ffffff',
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
