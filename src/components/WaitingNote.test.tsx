import { afterEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { WaitingNote } from './WaitingNote'
import type { Order, OrderStatus } from '@/types/order'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const order = (id: string, status: OrderStatus, createdAt: number): Order => ({
  id,
  orderNumber: createdAt,
  items: [],
  total: 0,
  status,
  paymentMethod: 'mock',
  createdAt,
})

let root: Root | null = null
let container: HTMLDivElement | null = null

function text(o: Order, active: Order[] | null): string {
  container = document.createElement('div')
  root = createRoot(container)
  act(() => root!.render(<WaitingNote order={o} active={active} />))
  return container.textContent ?? ''
}

afterEach(() => {
  act(() => root?.unmount())
  root = null
  container = null
})

describe('WaitingNote', () => {
  const mine = order('mine', 'paid', 2)

  it('進行中の注文を読み込み中は何も出さない（誤った「まもなく」を一瞬出さない）', () => {
    expect(text(mine, null)).toBe('')
  })

  it('前に注文がなければ「まもなく調理を始めます」', () => {
    expect(text(mine, [mine])).toContain('まもなく調理を始めます')
  })

  it('前に注文があれば件数を出す', () => {
    expect(text(mine, [order('a', 'paid', 1), mine])).toContain('あなたの前に 1 件の注文があります')
  })

  it('調理中なら「ただいまお作りしています」', () => {
    expect(text(order('x', 'preparing', 1), null)).toContain('ただいまお作りしています')
  })

  it('受け取り時間を予約した注文は、前の件数ではなく予約の時間を伝える', () => {
    const reserved: Order = { ...mine, pickupAt: new Date(2026, 10, 20, 12, 30).getTime() }
    const t = text(reserved, [order('a', 'paid', 1), reserved])
    expect(t).toContain('12:30')
    expect(t).toContain('予約')
    expect(t).not.toContain('件の注文')
  })
})
