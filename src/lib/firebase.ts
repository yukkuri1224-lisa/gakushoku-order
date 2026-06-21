// Firebase 初期化。
// 6つの VITE_FIREBASE_* が「すべて」設定されているときだけ初期化する。
// 1つでも欠けていれば isFirebaseConfigured = false となり、
// 同期層はローカル簡易同期（src/lib/orders/local.ts）に自動フォールバックする。
import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'

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

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  firestore = getFirestore(app)
}

// 未設定時は使われない（getOrderRepository がローカル実装を返すため）。
export const db = firestore
