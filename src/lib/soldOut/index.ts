// 売り切れ同期のファクトリ（注文と同じく、Firebase が設定されていれば Firestore）。
import { db, isFirebaseConfigured } from '@/lib/firebase'
import { FirestoreSoldOutRepository } from './firestore'
import { LocalSoldOutRepository } from './local'
import type { SoldOutRepository } from './types'

let instance: SoldOutRepository | null = null

export function getSoldOutRepository(): SoldOutRepository {
  if (instance) return instance
  instance =
    isFirebaseConfigured && db
      ? new FirestoreSoldOutRepository(db)
      : new LocalSoldOutRepository()
  return instance
}

export type { SoldOutRepository } from './types'
