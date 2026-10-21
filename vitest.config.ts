import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

// 単体テスト設定。@/ エイリアスは vite.config.ts と同じものをそろえる。
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
  },
})
