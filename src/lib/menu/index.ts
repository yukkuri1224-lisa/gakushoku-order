// メニューの保存先のファクトリ（注文・売り切れと同じく、Firebase が設定されていれば Firestore）。
import { db, isFirebaseConfigured } from '@/lib/firebase'
import { FirestoreMenuRepository } from './firestore'
import { LocalMenuRepository } from './local'
import type { MenuRepository } from './types'

let instance: MenuRepository | null = null

export function getMenuRepository(): MenuRepository {
  if (instance) return instance
  instance =
    isFirebaseConfigured && db ? new FirestoreMenuRepository(db) : new LocalMenuRepository()
  return instance
}

export type { MenuEntry, MenuRepository } from './types'
export { toStored, fromStored, validateMenuInput, yomiFromName } from './convert'
export type { StoredMenuItem, MenuInput, MenuInputErrors } from './convert'
