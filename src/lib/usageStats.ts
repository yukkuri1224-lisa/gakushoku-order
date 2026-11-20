// 利用状況の集計（副作用なし）。スタッフ画面の「利用状況」で使う。
import type { Order } from '@/types/order'

export type UsageRange = 'today' | 'week' | 'month'

export const RANGE_LABEL: Record<UsageRange, string> = {
  today: '今日',
  week: '7日間',
  month: '30日間',
}

const RANGE_DAYS: Record<UsageRange, number> = { today: 1, week: 7, month: 30 }

/** 時間帯のグラフに必ず出す時間（食堂が開いている時間） */
const FIRST_HOUR = 10
const LAST_HOUR = 19

export interface UsageStats {
  orders: number
  sales: number
  /** 1件あたりの金額（円、四捨五入） */
  average: number
  reservations: number
  teachers: number
  dining: { eatIn: number; takeout: number }
  /** 時間帯ごとの注文数（注文した時刻） */
  byHour: { hour: number; count: number }[]
  /** 日ごとの注文数（古い順。今日だけのときは 1 日分） */
  byDay: { label: string; count: number }[]
  /** 数量の多い順（上位 5 つ） */
  ranking: { name: string; quantity: number }[]
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** 期間の始まり（その日の 0 時） */
export function rangeStart(range: UsageRange, now: Date): number {
  const d = startOfDay(now)
  d.setDate(d.getDate() - (RANGE_DAYS[range] - 1))
  return d.getTime()
}

export function usageStats(all: Order[], range: UsageRange, now: Date): UsageStats {
  const since = rangeStart(range, now)
  const orders = all.filter((o) => o.createdAt >= since && o.createdAt <= now.getTime())
  const sales = orders.reduce((sum, o) => sum + o.total, 0)

  const hours = new Map<number, number>()
  for (const o of orders) {
    const h = new Date(o.createdAt).getHours()
    hours.set(h, (hours.get(h) ?? 0) + 1)
  }
  const from = Math.min(FIRST_HOUR, ...hours.keys())
  const to = Math.max(LAST_HOUR, ...hours.keys())
  const byHour = []
  for (let h = from; h <= to; h++) byHour.push({ hour: h, count: hours.get(h) ?? 0 })

  const byDay = []
  for (let i = 0; i < RANGE_DAYS[range]; i++) {
    const day = new Date(since)
    day.setDate(day.getDate() + i)
    const next = new Date(day)
    next.setDate(next.getDate() + 1)
    byDay.push({
      label: `${day.getMonth() + 1}/${day.getDate()}`,
      count: orders.filter((o) => o.createdAt >= day.getTime() && o.createdAt < next.getTime()).length,
    })
  }

  const qty = new Map<string, { name: string; quantity: number }>()
  for (const o of orders) {
    for (const i of o.items) {
      const key = i.menuItemId ?? i.name
      const cur = qty.get(key) ?? { name: i.name, quantity: 0 }
      cur.quantity += i.quantity
      qty.set(key, cur)
    }
  }
  const ranking = [...qty.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5)

  return {
    orders: orders.length,
    sales,
    average: orders.length ? Math.round(sales / orders.length) : 0,
    reservations: orders.filter((o) => o.pickupAt).length,
    teachers: orders.filter((o) => o.orderer === 'teacher').length,
    dining: {
      eatIn: orders.filter((o) => o.diningOption === 'eat_in').length,
      takeout: orders.filter((o) => o.diningOption === 'takeout').length,
    },
    byHour,
    byDay,
    ranking,
  }
}
