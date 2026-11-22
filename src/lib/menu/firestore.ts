// メニューの Firestore 実装。menuItems/{商品id} に 1 品ずつ置く（読み取りはだれでも、書き込みはスタッフだけ）。
import {
  type Firestore,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { fromStored, type StoredMenuItem } from './convert'
import type { MenuEntry, MenuRepository, Unsubscribe } from './types'

export const MENU_COLLECTION = 'menuItems'

export class FirestoreMenuRepository implements MenuRepository {
  constructor(private db: Firestore) {}

  subscribe(cb: (entries: MenuEntry[] | null) => void): Unsubscribe {
    return onSnapshot(
      collection(this.db, MENU_COLLECTION),
      (snap) => {
        if (snap.empty) {
          cb(null)
          return
        }
        cb(
          snap.docs
            .map((d) => ({ id: d.id, data: d.data() as StoredMenuItem }))
            .sort((a, b) => a.data.sortOrder - b.data.sortOrder)
            .map((d) => ({ item: fromStored(d.id, d.data), sortOrder: d.data.sortOrder })),
        )
      },
      (err) => {
        // 読めないとき（ルール未設定など）は、はじめから入っているメニューを使う
        console.warn('メニューを読み込めませんでした', err)
        cb(null)
      },
    )
  }

  async save(id: string, data: StoredMenuItem): Promise<void> {
    await setDoc(doc(this.db, MENU_COLLECTION, id), data)
  }

  async saveAll(entries: { id: string; data: StoredMenuItem }[]): Promise<void> {
    const batch = writeBatch(this.db)
    for (const e of entries) batch.set(doc(this.db, MENU_COLLECTION, e.id), e.data)
    await batch.commit()
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(this.db, MENU_COLLECTION, id))
  }
}
