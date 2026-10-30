import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { CheckoutPage } from './CheckoutPage'
import { MENU } from '@/data/menu'
import { buildOrderItem, defaultSelection } from '@/lib/menuOptions'
import { getOrderRepository } from '@/lib/orders'
import { todaysOrderIds } from '@/lib/myOrders'
import { useCartStore } from '@/store/cart'
import type { Order } from '@/types/order'

// React の act() をテスト環境で有効にする
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const curry = MENU.find((m) => m.id === 'curry')!

let root: Root | null = null
let container: HTMLDivElement | null = null

function OrderStub() {
  const { orderId } = useParams()
  return <p data-testid="order-page">{orderId}</p>
}

beforeEach(() => {
  localStorage.clear()
  // PayPay の支払い確認（/api/paypay/status）は「完了」と答える
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ status: 'COMPLETED' }), { status: 200 })),
  )
})

afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  root = null
  container = null
  vi.unstubAllGlobals()
})

describe('PayPay から戻ったとき', () => {
  it('戻った先のブラウザのカートが空でも、預けた中身で注文を作る', async () => {
    // 注文を始めたのは別のブラウザ（このブラウザのカートは空）
    useCartStore.setState({ items: [] })
    const line = buildOrderItem(curry, { ...defaultSelection(curry), size: 'large' }, 1)
    await getOrderRepository().savePendingDraft('mp-return-1', {
      items: [line],
      total: line.price,
      diningOption: 'takeout',
    })

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root!.render(
        <MemoryRouter initialEntries={['/checkout?pp=return&mpid=mp-return-1']}>
          <Routes>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order/:orderId" element={<OrderStub />} />
          </Routes>
        </MemoryRouter>,
      )
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(container.querySelector('[data-testid="order-page"]')?.textContent).toBe('mp-return-1')
    let order: Order | null = null
    getOrderRepository().subscribeOrder('mp-return-1', (o) => (order = o))()
    expect(order!.items[0].key).toBe(line.key)
    expect(order!.diningOption).toBe('takeout')
    expect(todaysOrderIds()).toContain('mp-return-1')
    // 預けた中身は消える
    expect(await getOrderRepository().getPendingDraft('mp-return-1')).toBeNull()
  })
})
