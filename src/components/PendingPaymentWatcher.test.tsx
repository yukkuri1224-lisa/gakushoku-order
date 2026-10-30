import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PendingPaymentWatcher } from './PendingPaymentWatcher'
import { getOrderRepository } from '@/lib/orders'
import { todaysOrderIds } from '@/lib/myOrders'
import { useCartStore } from '@/store/cart'

// React の act() をテスト環境で有効にする
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let container: HTMLDivElement | null = null

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  act(() => root?.unmount())
  container?.remove()
  root = null
  container = null
})

describe('PayPay で支払い中の注文の見張り', () => {
  it('別のブラウザで注文ができたら、この画面のカートを空にして注文番号へ進む', async () => {
    const item = { name: 'カレーライス', price: 480, quantity: 1 }
    useCartStore.setState({ items: [item] })
    localStorage.setItem('paypay.mpid', 'mp-watch-1')

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() =>
      root!.render(
        <MemoryRouter initialEntries={['/checkout']}>
          <PendingPaymentWatcher />
          <Routes>
            <Route path="/checkout" element={<p>checkout</p>} />
            <Route path="/order/:orderId" element={<p>order page</p>} />
          </Routes>
        </MemoryRouter>,
      ),
    )
    expect(container.textContent).toContain('checkout')

    // 戻った先のブラウザが注文を作った
    await act(async () => {
      await getOrderRepository().createOrder({ items: [item], total: 480 }, 'paypay', 'mp-watch-1')
    })

    expect(container.textContent).toContain('order page')
    expect(useCartStore.getState().items).toEqual([])
    expect(todaysOrderIds()).toContain('mp-watch-1')
    expect(localStorage.getItem('paypay.mpid')).toBeNull()
  })

  it('支払い中の注文がなければ何もしない', () => {
    useCartStore.setState({ items: [{ name: 'コロッケ', price: 80, quantity: 2 }] })
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() =>
      root!.render(
        <MemoryRouter initialEntries={['/menu']}>
          <PendingPaymentWatcher />
        </MemoryRouter>,
      ),
    )
    expect(useCartStore.getState().items).toHaveLength(1)
  })

  it('支払いが済んでいて注文がまだなければ、この画面で預けた中身から注文を作る', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ status: 'COMPLETED' }), { status: 200 })),
    )
    const item = { name: 'たこ焼き', price: 270, quantity: 1 }
    useCartStore.setState({ items: [item] })
    localStorage.setItem('paypay.mpid', 'mp-watch-2')
    await getOrderRepository().savePendingDraft('mp-watch-2', { items: [item], total: 270 })

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root!.render(
        <MemoryRouter initialEntries={['/checkout']}>
          <PendingPaymentWatcher />
          <Routes>
            <Route path="/checkout" element={<p>checkout</p>} />
            <Route path="/order/:orderId" element={<p>order page</p>} />
          </Routes>
        </MemoryRouter>,
      )
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(container.textContent).toContain('order page')
    expect(useCartStore.getState().items).toEqual([])
    expect(todaysOrderIds()).toContain('mp-watch-2')
  })

  it('支払いがまだ済んでいなければ、注文は作らない', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ status: 'CREATED' }), { status: 200 })),
    )
    const item = { name: 'たこ焼き', price: 270, quantity: 1 }
    useCartStore.setState({ items: [item] })
    localStorage.setItem('paypay.mpid', 'mp-watch-3')

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root!.render(
        <MemoryRouter initialEntries={['/checkout']}>
          <PendingPaymentWatcher />
        </MemoryRouter>,
      )
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })
    expect(useCartStore.getState().items).toHaveLength(1)
    let created = false
    getOrderRepository().subscribeOrder('mp-watch-3', (o) => (created = o !== null))()
    expect(created).toBe(false)
  })
})

