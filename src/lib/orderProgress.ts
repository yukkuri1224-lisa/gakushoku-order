// 注文の進み具合まわりの判定（副作用なし）。注文番号画面・注文中カードで使う。
import type { Order, OrderStatus } from '@/types/order'

/** できあがった注文を「注文中」カードに残しておく時間 */
export const RECENT_COMPLETED_MS = 30 * 60 * 1000

/** あなたの前に◯件：自分より先に作られた、受付済み・調理中の注文の数 */
export function queueAhead(order: Order, active: Order[]): number {
  return active.filter(
    (o) =>
      o.id !== order.id &&
      (o.status === 'paid' || o.status === 'preparing') &&
      o.createdAt < order.createdAt,
  ).length
}

/** 「注文中」カードに出すか：進行中、またはできあがってから 30 分以内 */
export function isShownInActiveCard(order: Order, now: number): boolean {
  if (order.status !== 'completed') return true
  return (
    typeof order.completedAt === 'number' &&
    now - order.completedAt <= RECENT_COMPLETED_MS
  )
}

/** 前回は未完了で、今回できあがった注文（前回の状態を知らない注文は対象外） */
export function newlyCompleted(
  prev: Map<string, OrderStatus>,
  orders: Order[],
): Order[] {
  return orders.filter(
    (o) =>
      o.status === 'completed' && prev.has(o.id) && prev.get(o.id) !== 'completed',
  )
}
