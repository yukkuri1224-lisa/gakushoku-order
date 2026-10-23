// 注文の購読フック（Firestore / ローカル同期のどちらでも動く）。
import { useEffect, useMemo, useRef, useState } from 'react'
import { getOrderRepository } from '@/lib/orders'
import { todaysOrderIds } from '@/lib/myOrders'
import { newlyCompleted } from '@/lib/orderProgress'
import { playChime, vibrate } from '@/lib/sound'
import type { Order, OrderStatus } from '@/types/order'

/** 1 件の注文を購読する */
export function useOrder(id: string | undefined): {
  order: Order | null
  loading: boolean
} {
  const [state, setState] = useState<{ order: Order | null; loading: boolean }>({
    order: null,
    loading: true,
  })
  useEffect(() => {
    if (!id) return
    return getOrderRepository().subscribeOrder(id, (order) =>
      setState({ order, loading: false }),
    )
  }, [id])
  return state
}

/** 進行中（受付済み・調理中）の注文をすべて購読する（「前に◯件」の計算用）。読み込み中は null */
export function useActiveOrders(): Order[] | null {
  const [orders, setOrders] = useState<Order[] | null>(null)
  useEffect(() => getOrderRepository().subscribeActiveOrders(setOrders), [])
  return orders
}

/** この端末で今日した注文を購読する（新しい順） */
export function useMyOrders(): Order[] {
  const [ids] = useState(() => todaysOrderIds())
  const [byId, setById] = useState<Record<string, Order>>({})
  useEffect(() => {
    const repo = getOrderRepository()
    const unsubs = ids.map((id) =>
      repo.subscribeOrder(id, (order) =>
        setById((prev) => {
          const next = { ...prev }
          if (order) next[id] = order
          else delete next[id]
          return next
        }),
      ),
    )
    return () => unsubs.forEach((unsub) => unsub())
  }, [ids])
  return useMemo(
    () => Object.values(byId).sort((a, b) => b.createdAt - a.createdAt),
    [byId],
  )
}

/**
 * できあがった瞬間を見つけて、通知音・振動を鳴らし、全画面のお知らせ用に返す。
 * 画面を開いた時点ですでに完了していた注文には反応しない。
 */
export function useCompletionAlert(orders: Order[]): {
  ready: Order | null
  dismiss: () => void
} {
  const prev = useRef<Map<string, OrderStatus> | null>(null)
  const [ready, setReady] = useState<Order | null>(null)
  useEffect(() => {
    if (prev.current) {
      const done = newlyCompleted(prev.current, orders)
      if (done.length > 0) {
        setReady(done[0])
        playChime(2)
        vibrate()
      }
    }
    prev.current = new Map(orders.map((o) => [o.id, o.status]))
  }, [orders])
  return { ready, dismiss: () => setReady(null) }
}
