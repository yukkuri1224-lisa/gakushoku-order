import { describe, expect, it } from 'vitest'
import type { Order, OrderItem } from '@/types/order'
import { periodRange, salesCsvByDay, salesCsvByItem, salesReport } from './salesReport'

const at = (m: number, d: number, h = 12) => new Date(2026, m - 1, d, h).getTime()

let n = 0
const order = (createdAt: number, items: OrderItem[], extra: Partial<Order> = {}): Order => ({
  id: `o${++n}`,
  orderNumber: n,
  items,
  total: items.reduce((s, i) => s + i.price * i.quantity, 0),
  status: 'completed',
  paymentMethod: 'paypay',
  createdAt,
  ...extra,
})

const curry = (qty = 1): OrderItem => ({ menuItemId: 'curry', name: 'カレーライス', price: 480, quantity: qty })
// お持ち帰り（容器代込み 500 円・上の容器ありで 510 円）
const curryTakeout = (top: boolean, qty = 1): OrderItem => ({
  menuItemId: 'curry',
  name: 'カレーライス',
  price: top ? 510 : 500,
  quantity: qty,
  options: [
    { groupId: 'top_container', groupLabel: '上の容器', choiceId: top ? 'with' : 'none', choiceLabel: top ? 'つける' : 'つけない', summaryLabel: '', priceDelta: top ? 10 : 0, isDefault: !top },
  ],
})
const takoyaki = (qty = 1): OrderItem => ({ menuItemId: 'takoyaki', name: 'たこ焼き', price: 270, quantity: qty })

const orders = [
  order(at(11, 20), [curry(2), takoyaki()], { diningOption: 'eat_in' }),
  order(at(11, 20, 13), [curryTakeout(true), curryTakeout(false, 2)], { diningOption: 'takeout' }),
  order(at(11, 21), [takoyaki(3)], { diningOption: 'takeout' }),
  order(at(10, 31), [curry()], { diningOption: 'eat_in' }),
]

describe('売上集計の期間', () => {
  it('日: その日の 0 時から次の日の 0 時まで。月: 1 日から次の月の 1 日まで', () => {
    expect(periodRange('day', '2026-11-20')).toEqual({ start: at(11, 20, 0), end: at(11, 21, 0) })
    expect(periodRange('month', '2026-11')).toEqual({ start: at(11, 1, 0), end: at(12, 1, 0) })
    expect(periodRange('month', '2026-12').end).toBe(new Date(2027, 0, 1).getTime())
  })
})

describe('売上集計', () => {
  const { start, end } = periodRange('month', '2026-11')
  const r = salesReport(orders, start, end)

  it('期間の中の注文だけで、売上・注文数・販売数・1件あたり', () => {
    expect(r.orders).toBe(3)
    expect(r.sales).toBe(480 * 2 + 270 + 510 + 500 * 2 + 270 * 3)
    expect(r.quantity).toBe(2 + 1 + 1 + 2 + 3)
    expect(r.average).toBe(Math.round(r.sales / 3))
  })

  it('うち容器代（下 20 円・上 10 円）と、店内・持ち帰りの売上', () => {
    expect(r.containerFees).toBe((20 + 10) * 1 + 20 * 2)
    expect(r.diningSales).toEqual({ eatIn: 480 * 2 + 270, takeout: 510 + 1000 + 810 })
  })

  it('メニューごと: 数量と売上（売上の多い順。選択肢が違っても同じ料理はまとめる）', () => {
    expect(r.byItem).toEqual([
      { name: 'カレーライス', quantity: 5, sales: 960 + 510 + 1000 },
      { name: 'たこ焼き', quantity: 4, sales: 270 * 4 },
    ])
  })

  it('日ごと: 期間のすべての日（注文のない日も 0 で）', () => {
    expect(r.byDay).toHaveLength(30)
    expect(r.byDay[19]).toEqual({ date: '2026-11-20', orders: 2, sales: 480 * 2 + 270 + 510 + 1000 })
    expect(r.byDay[20]).toEqual({ date: '2026-11-21', orders: 1, sales: 810 })
    expect(r.byDay[0]).toEqual({ date: '2026-11-01', orders: 0, sales: 0 })
  })

  it('CSV（Excel で開けるように先頭に BOM。カンマや " を含む名前も崩れない）', () => {
    const csv = salesCsvByItem({ ...r, byItem: [{ name: 'A,"B"', quantity: 1, sales: 100 }] })
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv).toContain('メニュー,数量,売上（円）')
    expect(csv).toContain('"A,""B""",1,100')
    const day = salesCsvByDay(r)
    expect(day).toContain('日付,注文数,売上（円）')
    expect(day).toContain('2026-11-20,2,')
  })
})
