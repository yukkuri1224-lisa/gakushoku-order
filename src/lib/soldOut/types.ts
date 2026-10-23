// 売り切れの端末間同期。注文（src/lib/orders）と同じく、
// Firestore 実装とローカル実装（Firebase 未設定時）を getSoldOutRepository() が差し替える。
// 売り切れは「その日だけ」有効（日付ごとに別の記録。次の日は自動で販売中に戻る）。
export type Unsubscribe = () => void

export interface SoldOutRepository {
  /** その日の売り切れ商品の id を購読する。読めないとき（ルール未設定など）は空で届く */
  subscribe(day: string, cb: (itemIds: string[]) => void): Unsubscribe
  /** 売り切れにする／販売を再開する */
  setSoldOut(day: string, itemId: string, soldOut: boolean): Promise<void>
}
