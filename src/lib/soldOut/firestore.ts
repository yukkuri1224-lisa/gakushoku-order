// 売り切れの Firestore 実装。
// 保存場所は dailyCounters/soldOut-{YYYY-MM-DD} の items 配列（商品 id）。
// dailyCounters は「日ごとの記録」の置き場で、注文番号の採番（dailyCounters/{YYYY-MM-DD}）と同じく
// 公開中の Firestore ルールで読み書きできるため、ルールを更新しなくても売り切れが使える。
import {
  type Firestore,
  arrayRemove,
  arrayUnion,
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore'
import type { SoldOutRepository, Unsubscribe } from './types'

export const SOLD_OUT_COLLECTION = 'dailyCounters'

/** その日の売り切れの記録の id（採番の記録 {YYYY-MM-DD} とは別） */
export function soldOutDocId(day: string): string {
  return `soldOut-${day}`
}

export class FirestoreSoldOutRepository implements SoldOutRepository {
  constructor(private db: Firestore) {}

  subscribe(day: string, cb: (itemIds: string[]) => void): Unsubscribe {
    return onSnapshot(
      doc(this.db, SOLD_OUT_COLLECTION, soldOutDocId(day)),
      (snap) => cb((snap.data()?.items as string[] | undefined) ?? []),
      (err) => {
        console.warn('売り切れを読み込めませんでした', err)
        cb([])
      },
    )
  }

  async setSoldOut(day: string, itemId: string, soldOut: boolean): Promise<void> {
    await setDoc(
      doc(this.db, SOLD_OUT_COLLECTION, soldOutDocId(day)),
      { items: soldOut ? arrayUnion(itemId) : arrayRemove(itemId) },
      { merge: true },
    )
  }
}
