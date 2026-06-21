// Firestore 実装。VITE_FIREBASE_* が揃っているときに使われる本番経路。
// リアルタイム同期は onSnapshot、当日通し番号は dailyCounters/{YYYY-MM-DD} の
// トランザクション加算で採番する。
import {
  type Firestore,
  addDoc,
  collection,
  doc,
  onSnapshot,
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

export class FirestoreOrderRepository implements OrderRepository {
  constructor(private db: Firestore) {}

  async createOrder(
    draft: OrderDraft,
    paymentMethod: PaymentMethod,
  ): Promise<{ id: string; orderNumber: number }> {
    const counterRef = doc(this.db, 'dailyCounters', todayKey())

    // 当日通し番号をトランザクションで安全に採番
    const orderNumber = await runTransaction(this.db, async (tx) => {
      const snap = await tx.get(counterRef)
      const current = (snap.data()?.count as number | undefined) ?? 0
      const next = current + 1
      tx.set(counterRef, { count: next, date: todayKey() }, { merge: true })
      return next
    })

    const data: Omit<Order, 'id'> = {
      orderNumber,
      items: draft.items,
      total: draft.total,
      status: 'paid',
      paymentMethod,
      createdAt: Date.now(),
    }
    const ref = await addDoc(collection(this.db, 'orders'), data)
    return { id: ref.id, orderNumber }
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
}
