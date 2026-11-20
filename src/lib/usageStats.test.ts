import { describe, expect, it } from 'vitest'
import type { Order } from '@/types/order'
import { rangeStart, usageStats } from './usageStats'

const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m).getTime()
const now = new Date(2026, 10, 20, 15, 0)

let n = 0
const order = (createdAt: number, extra: Partial<Order> = {}): Order => ({
  id: `o${++n}`,
  orderNumber: n,
  items: [{ menuItemId: 'curry', name: 'カレーライス', price: 480, quantity: 1 }],
  total: 480,
  status: 'completed',
  paymentMethod: 'mock',
  createdAt,
  ...extra,
})

describe('利用状況の集計', () => {
  const orders = [
    order(at(20, 11, 10), { diningOption: 'eat_in' }),
    order(at(20, 12, 5), {
      diningOption: 'takeout',
      total: 1230,
      orderer: 'teacher',
      items: [
        { menuItemId: 'katsu_curry', name: 'カツカレー', price: 600, quantity: 1 },
        { menuItemId: 'takoyaki', name: 'たこ焼き', price: 270, quantity: 2 },
        { menuItemId: 'curry', name: 'カレーライス', price: 90, quantity: 1 },
      ],
    }),
    order(at(20, 12, 40), { diningOption: 'eat_in', pickupAt: at(20, 13, 0), status: 'paid' }),
    order(at(19, 12, 0), { diningOption: 'eat_in' }),
    order(at(10, 12, 0)),
  ]

  it('期間の始まり: 今日は 0 時、7日間は 6 日前の 0 時、30日間は 29 日前の 0 時', () => {
    expect(rangeStart('today', now)).toBe(at(20, 0))
    expect(rangeStart('week', now)).toBe(at(14, 0))
    expect(rangeStart('month', now)).toBe(new Date(2026, 9, 22).getTime())
  })

  it('今日: 注文数・売上・1件あたり・予約・先生・店内と持ち帰り', () => {
    const s = usageStats(orders, 'today', now)
    expect(s.orders).toBe(3)
    expect(s.sales).toBe(480 + 1230 + 480)
    expect(s.average).toBe(Math.round((480 + 1230 + 480) / 3))
    expect(s.reservations).toBe(1)
    expect(s.teachers).toBe(1)
    expect(s.dining).toEqual({ eatIn: 2, takeout: 1 })
  })

  it('時間帯ごとの注文数（10時〜19時は必ず出す）', () => {
    const s = usageStats(orders, 'today', now)
    expect(s.byHour[0]).toEqual({ hour: 10, count: 0 })
    expect(s.byHour.find((h) => h.hour === 11)?.count).toBe(1)
    expect(s.byHour.find((h) => h.hour === 12)?.count).toBe(2)
    expect(s.byHour[s.byHour.length - 1].hour).toBe(19)
  })

  it('人気メニュー: 数量の多い順（同じ料理は選択肢が違っても合わせる）', () => {
    const s = usageStats(orders, 'today', now)
    expect(s.ranking.slice(0, 3)).toEqual([
      { name: 'カレーライス', quantity: 3 },
      { name: 'たこ焼き', quantity: 2 },
      { name: 'カツカレー', quantity: 1 },
    ])
  })

  it('7日間: 期間内の注文だけを数え、日ごとの注文数を古い順に7日分', () => {
    const s = usageStats(orders, 'week', now)
    expect(s.orders).toBe(4)
    expect(s.byDay).toHaveLength(7)
    expect(s.byDay[0]).toEqual({ label: '11/14', count: 0 })
    expect(s.byDay[5]).toEqual({ label: '11/19', count: 1 })
    expect(s.byDay[6]).toEqual({ label: '11/20', count: 3 })
  })

  it('注文がなければ、すべて 0（1件あたりも 0）', () => {
    const s = usageStats([], 'today', now)
    expect(s.orders).toBe(0)
    expect(s.average).toBe(0)
    expect(s.ranking).toEqual([])
  })
})
