// 売上集計（副作用なし）。スタッフ画面の「売上」で使う。
// 期間は 1 日（YYYY-MM-DD）か 1 か月（YYYY-MM）。手元の時刻（学校の時刻）で区切る。
import { CONTAINER_FEE } from '@/lib/takeout'
import type { Order } from '@/types/order'

export type PeriodKind = 'day' | 'month'

export interface SalesReport {
  sales: number
  orders: number
  /** 販売数（点） */
  quantity: number
  /** 1件あたり（円、四捨五入） */
  average: number
  /** うちお持ち帰りの容器代（下・上） */
  containerFees: number
  diningSales: { eatIn: number; takeout: number }
  /** 日ごと（期間のすべての日。古い順） */
  byDay: { date: string; orders: number; sales: number }[]
  /** メニューごと（売上の多い順） */
  byItem: { name: string; quantity: number; sales: number }[]
}

const pad = (n: number) => String(n).padStart(2, '0')
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** 期間の始まりと終わり（終わりは含まない。epoch ミリ秒） */
export function periodRange(kind: PeriodKind, value: string): { start: number; end: number } {
  const [y, m, d] = value.split('-').map(Number)
  if (kind === 'day') {
    return { start: new Date(y, m - 1, d).getTime(), end: new Date(y, m - 1, d + 1).getTime() }
  }
  return { start: new Date(y, m - 1, 1).getTime(), end: new Date(y, m, 1).getTime() }
}

/** いまの日・月（入力欄の初期値） */
export function currentPeriod(kind: PeriodKind, now = new Date()): string {
  return kind === 'day' ? dateKey(now) : `${now.getFullYear()}-${pad(now.getMonth() + 1)}`
}

/** 1 つ前・後の日・月 */
export function shiftPeriod(kind: PeriodKind, value: string, dir: -1 | 1): string {
  const [y, m, d] = value.split('-').map(Number)
  return kind === 'day'
    ? dateKey(new Date(y, m - 1, d + dir))
    : currentPeriod('month', new Date(y, m - 1 + dir, 1))
}

export function salesReport(all: Order[], start: number, end: number): SalesReport {
  const orders = all.filter((o) => o.createdAt >= start && o.createdAt < end)
  const sales = orders.reduce((s, o) => s + o.total, 0)

  let quantity = 0
  let containerFees = 0
  const items = new Map<string, { name: string; quantity: number; sales: number }>()
  for (const o of orders) {
    for (const i of o.items) {
      quantity += i.quantity
      // お持ち帰りで容器を使う料理には「上の容器」の選択がある（下の容器は価格に含まれている）
      const top = i.options?.find((op) => op.groupId === 'top_container')
      if (top) containerFees += (CONTAINER_FEE + top.priceDelta) * i.quantity
      const key = i.menuItemId ?? i.name
      const cur = items.get(key) ?? { name: i.name, quantity: 0, sales: 0 }
      cur.quantity += i.quantity
      cur.sales += i.price * i.quantity
      items.set(key, cur)
    }
  }

  const byDay: SalesReport['byDay'] = []
  for (let t = new Date(start); t.getTime() < end; t = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1)) {
    const next = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1).getTime()
    const day = orders.filter((o) => o.createdAt >= t.getTime() && o.createdAt < next)
    byDay.push({ date: dateKey(t), orders: day.length, sales: day.reduce((s, o) => s + o.total, 0) })
  }

  const sumBy = (opt: 'eat_in' | 'takeout') =>
    orders.filter((o) => o.diningOption === opt).reduce((s, o) => s + o.total, 0)

  return {
    sales,
    orders: orders.length,
    quantity,
    average: orders.length ? Math.round(sales / orders.length) : 0,
    containerFees,
    diningSales: { eatIn: sumBy('eat_in'), takeout: sumBy('takeout') },
    byDay,
    byItem: [...items.values()].sort((a, b) => b.sales - a.sales || b.quantity - a.quantity),
  }
}

function csv(rows: (string | number)[][]): string {
  const cell = (v: string | number) => {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  // Excel で文字化けしないよう、先頭に BOM を付ける
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n'
}

export function salesCsvByItem(r: SalesReport): string {
  return csv([['メニュー', '数量', '売上（円）'], ...r.byItem.map((i) => [i.name, i.quantity, i.sales])])
}

export function salesCsvByDay(r: SalesReport): string {
  return csv([['日付', '注文数', '売上（円）'], ...r.byDay.map((d) => [d.date, d.orders, d.sales])])
}
