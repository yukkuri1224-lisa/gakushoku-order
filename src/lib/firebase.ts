// Firebase 初期化。
// 6つの VITE_FIREBASE_* が「すべて」設定されているときだけ初期化する。
// 1つでも欠けていれば isFirebaseConfigured = false となり、
// 同期層はローカル簡易同期（src/lib/orders/local.ts）に自動フォールバックする。
import { initializeApp, type FirebaseApp } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured: boolean = Object.values(firebaseConfig).every(
  (v) => typeof v === 'string' && v.length > 0,
)

let app: FirebaseApp | undefined
let firestore: Firestore | undefined

/** 手元で試すとき（npm run dev）だけ、Firebase のエミュレーターにつなぐ（本番のビルドには入らない） */
export const useFirebaseEmulators: boolean =
  import.meta.env.DEV && Boolean(import.meta.env.VITE_USE_FIREBASE_EMULATORS)

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  firestore = getFirestore(app)
  if (useFirebaseEmulators) connectFirestoreEmulator(firestore, '127.0.0.1', 8080)
}

// 未設定時は使われない（getOrderRepository がローカル実装を返すため）。
export const db = firestore
// Google ログイン（src/lib/auth.ts）で使う
export const firebaseApp = app
