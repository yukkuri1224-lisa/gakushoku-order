// 同期層のファクトリ。
// Firebase が設定されていれば Firestore、なければローカル簡易同期を返す（シングルトン）。
// 決済プロバイダ（src/lib/payment）と同じ「差し替え式」の思想。
import { db, isFirebaseConfigured } from '@/lib/firebase'
import { FirestoreOrderRepository } from './firestore'
import { LocalOrderRepository } from './local'
import type { OrderRepository } from './types'

let instance: OrderRepository | null = null

export function getOrderRepository(): OrderRepository {
  if (instance) return instance
  instance =
    isFirebaseConfigured && db
      ? new FirestoreOrderRepository(db)
      : new LocalOrderRepository()
  return instance
}

/** 現在どちらの同期方式で動いているか（画面の注意書き表示に使用）。 */
export const syncMode: 'firestore' | 'local' =
  isFirebaseConfigured && db ? 'firestore' : 'local'

export type { OrderRepository } from './types'
