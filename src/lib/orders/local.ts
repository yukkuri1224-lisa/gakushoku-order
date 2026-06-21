// ローカル簡易同期の実装（Firebase未設定時のフォールバック）。
// localStorage に注文を保存し、BroadcastChannel + storage イベントで
// 同一PC・別タブ間にリアルタイム反映する。1台のPCで学生タブ/スタッフタブを
// 開けばデモのフロー全体を確認できる。
//
// ※端末をまたぐ本物のリアルタイム同期が必要なら Firebase を設定すること
//   （getOrderRepository が自動で FirestoreOrderRepository に切り替わる）。
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

const ORDERS_KEY = 'gakushoku.orders'
const COUNTER_PREFIX = 'gakushoku.counter.'
const CHANNEL_NAME = 'gakushoku-orders'

function isActive(o: Order): boolean {
  return o.status === 'paid' || o.status === 'preparing'
}

export class LocalOrderRepository implements OrderRepository {
  private channel: BroadcastChannel | null
  private orderSubs = new Map<string, Set<OrderCallback>>()
  private activeSubs = new Set<OrdersCallback>()

  constructor() {
    this.channel =
      typeof BroadcastChannel !== 'undefined'
        ? new BroadcastChannel(CHANNEL_NAME)
        : null
    // 他タブからの変更通知
    this.channel?.addEventListener('message', () => this.emitAll())
    window.addEventListener('storage', (e) => {
      if (e.key === ORDERS_KEY) this.emitAll()
    })
  }

  private readAll(): Order[] {
    try {
      return JSON.parse(localStorage.getItem(ORDERS_KEY) ?? '[]') as Order[]
    } catch {
      return []
    }
  }

  private writeAll(orders: Order[]): void {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
    this.channel?.postMessage('changed') // 他タブへ通知
    this.emitAll() // 自タブの購読者へ通知
  }

  private emitAll(): void {
    const all = this.readAll()
    const active = all.filter(isActive).sort((a, b) => a.createdAt - b.createdAt)
    this.activeSubs.forEach((cb) => cb(active))
    this.orderSubs.forEach((set, id) => {
      const found = all.find((o) => o.id === id) ?? null
      set.forEach((cb) => cb(found))
    })
  }

  async createOrder(
    draft: OrderDraft,
    paymentMethod: PaymentMethod,
  ): Promise<{ id: string; orderNumber: number }> {
    const all = this.readAll()
    const ckey = COUNTER_PREFIX + todayKey()
    const orderNumber = (parseInt(localStorage.getItem(ckey) ?? '0', 10) || 0) + 1
    localStorage.setItem(ckey, String(orderNumber))

    const id =
      'local-' +
      Date.now().toString(36) +
      '-' +
      Math.random().toString(36).slice(2, 7)

    const order: Order = {
      id,
      orderNumber,
      items: draft.items,
      total: draft.total,
      status: 'paid',
      paymentMethod,
      createdAt: Date.now(),
    }
    all.push(order)
    this.writeAll(all)
    return { id, orderNumber }
  }

  subscribeOrder(id: string, cb: OrderCallback): Unsubscribe {
    let set = this.orderSubs.get(id)
    if (!set) {
      set = new Set()
      this.orderSubs.set(id, set)
    }
    set.add(cb)
    // 現在値を即時に通知
    cb(this.readAll().find((o) => o.id === id) ?? null)
    return () => {
      const s = this.orderSubs.get(id)
      s?.delete(cb)
      if (s && s.size === 0) this.orderSubs.delete(id)
    }
  }

  subscribeActiveOrders(cb: OrdersCallback): Unsubscribe {
    this.activeSubs.add(cb)
    const active = this.readAll()
      .filter(isActive)
      .sort((a, b) => a.createdAt - b.createdAt)
    cb(active)
    return () => {
      this.activeSubs.delete(cb)
    }
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    const all = this.readAll()
    const idx = all.findIndex((o) => o.id === id)
    if (idx >= 0) {
      all[idx] = {
        ...all[idx],
        status,
        ...(status === 'completed' ? { completedAt: Date.now() } : {}),
      }
      this.writeAll(all)
    }
  }
}
