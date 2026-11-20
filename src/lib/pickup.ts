// 受け取り時間の予約（副作用なし）。
// その日のうちの、15分きざみの時間から選ぶ。今から15分あと以降で、食堂が閉まるまで。
// ▼食堂の時間が変わったら PICKUP_OPEN / PICKUP_CLOSE を直す。
import type { Order } from '@/types/order'

export const PICKUP_OPEN = { hour: 10, minute: 30 }
export const PICKUP_CLOSE = { hour: 19, minute: 30 }
export const PICKUP_STEP_MIN = 15
/** 今から何分あと以降を選べるか（作る時間） */
export const PICKUP_LEAD_MIN = 15

const MIN = 60 * 1000

function atTime(day: Date, t: { hour: number; minute: number }): number {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), t.hour, t.minute).getTime()
}

/** 選べる受け取り時間（epoch ミリ秒） */
export function pickupSlots(now: Date): number[] {
  const open = atTime(now, PICKUP_OPEN)
  const close = atTime(now, PICKUP_CLOSE)
  const earliest = now.getTime() + PICKUP_LEAD_MIN * MIN
  const slots: number[] = []
  for (let t = open; t <= close; t += PICKUP_STEP_MIN * MIN) {
    if (t >= earliest) slots.push(t)
  }
  return slots
}

/** 「12:30」 */
export function formatPickup(ms: number): string {
  const d = new Date(ms)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** いま選べる受け取り時間か（過ぎた・ほかの日・きざみに合わない時間は使えない） */
export function isPickupValid(ms: number, now: Date): boolean {
  return pickupSlots(now).includes(ms)
}

/** 厨房で並べる順の時刻: 予約は受け取りの15分前、ほかは注文した時刻 */
export function dueAt(order: Pick<Order, 'createdAt' | 'pickupAt'>): number {
  return order.pickupAt ? order.pickupAt - PICKUP_LEAD_MIN * MIN : order.createdAt
}
