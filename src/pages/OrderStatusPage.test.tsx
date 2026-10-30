import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import App from '@/App'
import { GATE_KEY } from '@/lib/gate'
import { getOrderRepository } from '@/lib/orders'
import { useDiningStore } from '@/store/dining'

// React の act() をテスト環境で有効にする
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let container: HTMLDivElement | null = null

async function newOrder(): Promise<string> {
  const { id } = await getOrderRepository().createOrder(
    { items: [{ name: 'カレーライス', price: 400, quantity: 1 }], total: 400, diningOption: 'eat_in' },
    'mock',
  )
  return id
}

function renderAt(path: string): HTMLDivElement {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() =>
    root!.render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    ),
  )
  return container
}

function buttonByText(el: HTMLElement, text: string): HTMLElement | undefined {
  return Array.from(el.querySelectorAll<HTMLElement>('button, a')).find(
    (b) => b.textContent?.trim() === text,
  )
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(GATE_KEY, '1')
  useDiningStore.setState({ option: null })
})

afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  root = null
  container = null
})

describe('できあがったあと（注文番号の画面）', () => {
  it('厨房が「調理完了」を押したお知らせで「わかりました」を押すと、ホーム画面に戻る', async () => {
    const id = await newOrder()
    const el = renderAt(`/order/${id}`)
    expect(el.textContent).toContain('ご注文ありがとうございました')

    await act(() => getOrderRepository().updateStatus(id, 'completed'))
    const ok = buttonByText(el, 'わかりました')
    expect(ok).toBeDefined()

    act(() => ok!.click())
    expect(el.textContent).toContain('ご利用方法を選んでください')
    expect(el.textContent).not.toContain('追加で注文する')
  })

  it('できあがった注文を開いたときは「追加で注文する」ではなく「ホームに戻る」を出す', async () => {
    const id = await newOrder()
    await getOrderRepository().updateStatus(id, 'completed')
    const el = renderAt(`/order/${id}`)
    expect(el.textContent).toContain('できあがりました')
    expect(el.textContent).not.toContain('追加で注文する')

    const home = buttonByText(el, 'ホームに戻る')
    expect(home).toBeDefined()
    act(() => home!.click())
    expect(el.textContent).toContain('ご利用方法を選んでください')
  })

  it('まだできあがっていない注文では「追加で注文する」を出す', async () => {
    const id = await newOrder()
    const el = renderAt(`/order/${id}`)
    expect(buttonByText(el, '追加で注文する')).toBeDefined()
  })
})
