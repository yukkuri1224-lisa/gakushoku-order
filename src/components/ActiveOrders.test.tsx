import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { ActiveOrders } from './ActiveOrders'
import { getOrderRepository } from '@/lib/orders'
import { rememberOrder } from '@/lib/myOrders'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let container: HTMLDivElement | null = null

beforeEach(() => localStorage.clear())
afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  root = null
  container = null
})

async function render() {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root!.render(
      <MemoryRouter>
        <ActiveOrders />
      </MemoryRouter>,
    ),
  )
  return container
}

describe('注文中のカード（メニュー・ご利用方法の画面）', () => {
  it('できあがって「受け取りました」を押した注文は、カードから消える', async () => {
    const repo = getOrderRepository()
    const { id } = await repo.createOrder({ items: [{ name: 'x', price: 1, quantity: 1 }], total: 1 }, 'mock')
    rememberOrder(id, Date.now())
    const el = await render()
    expect(el.querySelector('[aria-label="注文中の商品"]')).not.toBeNull()

    await act(async () => repo.updateStatus(id, 'completed'))
    const received = [...el.querySelectorAll('button')].find((b) => b.textContent === '受け取りました')!
    await act(async () => received.click())
    expect(el.querySelector('[aria-label="注文中の商品"]')).toBeNull()
  })
})
