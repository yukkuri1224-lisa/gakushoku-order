// 注文の端末間同期の抽象インターフェース。
// 実装は2つ: FirestoreOrderRepository（本物のリアルタイム同期）と
//            LocalOrderRepository（Firebase未設定時の同一PC・タブ間フォールバック）。
// getOrderRepository()（index.ts）が環境に応じて差し替える。
import type {
  Order,
  OrderDraft,
  OrderStatus,
  PaymentMethod,
} from '@/types/order'

export type OrderCallback = (order: Order | null) => void
export type OrdersCallback = (orders: Order[]) => void
export type Unsubscribe = () => void

export interface OrderRepository {
  /** 決済成功後に注文を作成（status='paid'）。当日通し番号を採番して返す。 */
  createOrder(
    draft: OrderDraft,
    paymentMethod: PaymentMethod,
  ): Promise<{ id: string; orderNumber: number }>

  /** 1件の注文を購読（学生の状態画面用）。存在しなければ null を渡す。 */
  subscribeOrder(id: string, cb: OrderCallback): Unsubscribe

  /** 進行中の注文（paid / preparing）を購読（スタッフ画面用）。 */
  subscribeActiveOrders(cb: OrdersCallback): Unsubscribe

  /** 注文の状態を更新（preparing / completed）。 */
  updateStatus(id: string, status: OrderStatus): Promise<void>
}

/** 採番キー用の YYYY-MM-DD（ローカルタイム） */
export function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
