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
  /**
   * 決済成功後に注文を作成（status='paid'）。当日通し番号を採番して返す。
   * orderId（PayPay の merchantPaymentId など）を渡すと、それを注文IDにする。
   * 同じIDの注文が既にあれば、採番も書き込みもせずにその注文を返す（再試行・再読み込み対策）。
   */
  createOrder(
    draft: OrderDraft,
    paymentMethod: PaymentMethod,
    orderId?: string,
  ): Promise<{ id: string; orderNumber: number }>

  /** 1件の注文を購読（学生の状態画面用）。存在しなければ null を渡す。 */
  subscribeOrder(id: string, cb: OrderCallback): Unsubscribe

  /** 進行中の注文（paid / preparing）を購読（スタッフ画面用）。 */
  subscribeActiveOrders(cb: OrdersCallback): Unsubscribe

  /** 注文の状態を更新（preparing / completed）。 */
  updateStatus(id: string, status: OrderStatus): Promise<void>

  /**
   * PayPay へ移る前に、注文の中身を支払いIDで預ける。
   * スマホでは PayPay アプリから「ふだんのブラウザ」に戻ることがあり、注文を始めたブラウザ
   * （やホーム画面のアプリ）のカートが見えない。預けておけば、戻った先でも注文を作れる。
   */
  savePendingDraft(paymentId: string, draft: OrderDraft): Promise<void>
  /** 預けた注文の中身を取り出す（なければ null） */
  getPendingDraft(paymentId: string): Promise<OrderDraft | null>
  /** 注文を作ったあと、預けた中身を消す */
  deletePendingDraft(paymentId: string): Promise<void>
}

/** 採番キー用の YYYY-MM-DD（ローカルタイム） */
export function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
