import { describe, expect, it } from 'vitest'
import { isShownInActiveCard, newlyCompleted, queueAhead } from './orderProgress'
import type { Order, OrderStatus } from '@/types/order'

function order(id: string, status: OrderStatus, createdAt: number, extra: Partial<Order> = {}): Order {
  return {
    id,
    orderNumber: createdAt,
    items: [],
    total: 0,
    status,
    paymentMethod: 'mock',
    createdAt,
    ...extra,
  }
}

const MIN = 60 * 1000

describe('queueAhead（あなたの前に◯件）', () => {
  const a = order('a', 'paid', 1)
  const b = order('b', 'preparing', 2)
  const mine = order('mine', 'paid', 3)
  const later = order('later', 'paid', 4)
  const done = order('done', 'completed', 0)

  it('自分より先に作られた受付済み・調理中の注文だけを数える', () => {
    expect(queueAhead(mine, [a, b, mine, later, done])).toBe(2)
  })

  it('一番先の注文なら 0', () => {
    expect(queueAhead(a, [a, b, mine, later])).toBe(0)
  })
})

describe('isShownInActiveCard（注文中カードに出すか）', () => {
  const now = 100 * MIN

  it('進行中の注文は出す', () => {
    expect(isShownInActiveCard(order('x', 'paid', 0), now)).toBe(true)
    expect(isShownInActiveCard(order('x', 'preparing', 0), now)).toBe(true)
  })

  it('できあがってから 30 分以内は出す', () => {
    expect(isShownInActiveCard(order('x', 'completed', 0, { completedAt: now - 29 * MIN }), now)).toBe(true)
  })

  it('できあがってから 30 分を過ぎたら出さない', () => {
    expect(isShownInActiveCard(order('x', 'completed', 0, { completedAt: now - 31 * MIN }), now)).toBe(false)
  })

  it('できあがった時刻が分からない完了済みの注文は出さない', () => {
    expect(isShownInActiveCard(order('x', 'completed', 0), now)).toBe(false)
  })
})

describe('newlyCompleted（いま、できあがった注文）', () => {
  it('前回は未完了で、今回できあがった注文だけを返す', () => {
    const prev = new Map<string, OrderStatus>([
      ['a', 'paid'],
      ['b', 'completed'],
    ])
    const result = newlyCompleted(prev, [
      order('a', 'completed', 1),
      order('b', 'completed', 2),
      order('c', 'completed', 3), // 前回の状態を知らない（開いた時点で完了済み）
    ])
    expect(result.map((o) => o.id)).toEqual(['a'])
  })
})
