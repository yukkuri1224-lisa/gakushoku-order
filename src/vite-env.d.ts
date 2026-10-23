/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ACCESS_PASSWORD?: string
  readonly VITE_STAFF_PASSWORD?: string
  readonly VITE_LOGIN_DOMAIN?: string // 例: gl.pen-kanagawa.ed.jp（設定すると Google ログインに切り替わる）
  readonly VITE_PAYMENT_MODE?: 'mock' | 'paypay'
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
