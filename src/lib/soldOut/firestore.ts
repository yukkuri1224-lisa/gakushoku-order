// 売り切れの Firestore 実装。soldOut/{YYYY-MM-DD} の items 配列に商品 id を入れる。
// firestore.rules に soldOut の許可が必要（未反映だと読めない → 売り切れなしとして扱う）。
import {
  type Firestore,
  arrayRemove,
  arrayUnion,
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore'
import type { SoldOutRepository, Unsubscribe } from './types'

export class FirestoreSoldOutRepository implements SoldOutRepository {
  constructor(private db: Firestore) {}

  subscribe(day: string, cb: (itemIds: string[]) => void): Unsubscribe {
    return onSnapshot(
      doc(this.db, 'soldOut', day),
      (snap) => cb((snap.data()?.items as string[] | undefined) ?? []),
      (err) => {
        console.warn('売り切れを読み込めませんでした', err)
        cb([])
      },
    )
  }

  async setSoldOut(day: string, itemId: string, soldOut: boolean): Promise<void> {
    await setDoc(
      doc(this.db, 'soldOut', day),
      { items: soldOut ? arrayUnion(itemId) : arrayRemove(itemId) },
      { merge: true },
    )
  }
}
