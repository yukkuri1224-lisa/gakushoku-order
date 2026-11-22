import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { OrderStatusPage } from './OrderStatusPage'
import { getOrderRepository } from '@/lib/orders'

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

async function render(orderId: string) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root!.render(
      <MemoryRouter initialEntries={[`/order/${orderId}`]}>
        <Routes>
          <Route path="/order/:orderId" element={<OrderStatusPage />} />
          <Route path="/menu" element={<p>メニューの画面</p>} />
        </Routes>
      </MemoryRouter>,
    ),
  )
  return container
}

const items = [{ name: 'カレーライス', price: 480, quantity: 1 }]
const buttons = (el: HTMLElement) => [...el.querySelectorAll('button, a')].map((b) => b.textContent?.trim())

describe('注文番号の画面', () => {
  it('「追加で注文する」と「通知音オン」は出さず、左上の「戻る」でメニューへ', async () => {
    const { id } = await getOrderRepository().createOrder({ items, total: 480 }, 'mock')
    const el = await render(id)
    expect(el.textContent).toContain('ご注文ありがとうございました')
    expect(el.textContent).not.toContain('追加で注文する')
    expect(el.textContent).not.toContain('通知音オン')
    expect(el.querySelector('a[aria-label="戻る"]')?.getAttribute('href')).toBe('/menu')
  })

  it('できあがったら「受け取りました」を出し、押すとメニューに戻る', async () => {
    const repo = getOrderRepository()
    const { id } = await repo.createOrder({ items, total: 480 }, 'mock')
    const el = await render(id)
    await act(async () => repo.updateStatus(id, 'completed'))
    // できあがりのお知らせ（全画面）の「受け取りました」
    const received = [...el.querySelectorAll('button')].find((b) => b.textContent === '受け取りました')!
    expect(received).toBeDefined()
    await act(async () => received.click())
    expect(el.textContent).toContain('メニューの画面')
    expect(buttons(el)).not.toContain('追加で注文する')
  })
})
