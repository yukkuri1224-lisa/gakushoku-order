// Firestore 実装。VITE_FIREBASE_* が揃っているときに使われる本番経路。
// リアルタイム同期は onSnapshot、当日通し番号は dailyCounters/{YYYY-MM-DD} の
// トランザクション加算で採番する。
import {
  type Firestore,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  query,
  runTransaction,
  updateDoc,
  where,
} from 'firebase/firestore'
import type {
  Order,
  OrderDraft,
  OrderStatus,
  PaymentMethod,
} from '@/types/order'
import {
  type OrderCallback,
  type OrderRepository,
  type OrdersCallback,
  type Unsubscribe,
  todayKey,
} from './types'
import { buildOrderData } from './buildOrderData'

export class FirestoreOrderRepository implements OrderRepository {
  constructor(private db: Firestore) {}

  async createOrder(
    draft: OrderDraft,
    paymentMethod: PaymentMethod,
    orderId?: string,
  ): Promise<{ id: string; orderNumber: number }> {
    const counterRef = doc(this.db, 'dailyCounters', todayKey())
    const orderRef = orderId
      ? doc(this.db, 'orders', orderId)
      : doc(collection(this.db, 'orders'))

    // 採番と注文の書き込みを1つのトランザクションで行う。
    // 同じIDの注文が既にあれば（再試行・再読み込み）、それを返して何も書かない。
    // ※トランザクションでは読み取りをすべて書き込みより先に行う必要がある。
    const orderNumber = await runTransaction(this.db, async (tx) => {
      const existing = await tx.get(orderRef)
      if (existing.exists()) {
        return existing.data().orderNumber as number
      }
      const snap = await tx.get(counterRef)
      const current = (snap.data()?.count as number | undefined) ?? 0
      const next = current + 1
      tx.set(counterRef, { count: next, date: todayKey() }, { merge: true })

      tx.set(orderRef, buildOrderData(draft, paymentMethod, next, Date.now()))
      return next
    })

    return { id: orderRef.id, orderNumber }
  }

  subscribeOrder(id: string, cb: OrderCallback): Unsubscribe {
    const ref = doc(this.db, 'orders', id)
    return onSnapshot(ref, (snap) => {
      const data = snap.data()
      if (!data) {
        cb(null)
        return
      }
      cb({ id: snap.id, ...(data as Omit<Order, 'id'>) })
    })
  }

  subscribeActiveOrders(cb: OrdersCallback): Unsubscribe {
    // status の in フィルタのみ（複合インデックス不要）。並び替えはクライアント側で行う。
    const q = query(
      collection(this.db, 'orders'),
      where('status', 'in', ['paid', 'preparing']),
    )
    return onSnapshot(q, (snap) => {
      const orders = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }))
        .sort((a, b) => a.createdAt - b.createdAt)
      cb(orders)
    })
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    const ref = doc(this.db, 'orders', id)
    const patch: Partial<Order> = { status }
    if (status === 'completed') patch.completedAt = Date.now()
    await updateDoc(ref, patch)
  }

  // 預けた中身は orders/pending-{支払いID} に置く（公開中のルールで読み書きできる場所）。
  // status が paid / preparing ではないので、厨房ボードや「前に◯件」には出ない。
  private pendingRef(paymentId: string) {
    return doc(this.db, 'orders', `pending-${paymentId}`)
  }

  async savePendingDraft(paymentId: string, draft: OrderDraft): Promise<void> {
    // Firestore は undefined を拒否するため、JSON を通して undefined の項目を落とす
    await setDoc(this.pendingRef(paymentId), {
      status: 'awaiting_payment',
      draft: JSON.parse(JSON.stringify(draft)) as OrderDraft,
      createdAt: Date.now(),
    })
  }

  async getPendingDraft(paymentId: string): Promise<OrderDraft | null> {
    const snap = await getDoc(this.pendingRef(paymentId))
    return (snap.data()?.draft as OrderDraft | undefined) ?? null
  }

  async deletePendingDraft(paymentId: string): Promise<void> {
    await deleteDoc(this.pendingRef(paymentId))
  }
}
