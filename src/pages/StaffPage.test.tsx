import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { StaffPage } from './StaffPage'
import { STAFF_KEY } from '@/lib/gate'
import { getOrderRepository } from '@/lib/orders'
import { MENU } from '@/data/menu'
import { buildOrderItem } from '@/lib/menuOptions'
import { getSoldOutRepository } from '@/lib/soldOut'
import { todayKey } from '@/lib/orders/types'

// React の act() をテスト環境で有効にする
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const items = [{ name: 'カレーライス', price: 480, quantity: 1 }]

let root: Root | null = null
let container: HTMLDivElement | null = null

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(STAFF_KEY, '1')
})

afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  root = null
  container = null
})

describe('厨房ボード', () => {
  it('お持ち帰りの注文に「持ち帰り」、旧データ（利用方法なし）には何も付けずに表示する', async () => {
    const repo = getOrderRepository()
    await repo.createOrder({ items, total: 480, diningOption: 'takeout' }, 'mock')
    await repo.createOrder({ items, total: 480 }, 'mock')

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() =>
      root!.render(
        <MemoryRouter>
          <StaffPage />
        </MemoryRouter>,
      ),
    )

    const cards = container.querySelectorAll('article')
    expect(cards).toHaveLength(2)
    expect(cards[0].textContent).toContain('持ち帰り')
    expect(cards[1].textContent).not.toContain('持ち帰り')
    expect(cards[1].textContent).not.toContain('店内')
  })

  it('うどん・そばは、初期値のままの「普通」でも麺の種類を必ず出す', async () => {
    const kake = MENU.find((m) => m.id === 'kake')!
    const line = buildOrderItem(kake, { noodle: 'soba', size: 'regular' }, 1)
    await getOrderRepository().createOrder({ items: [line], total: line.price }, 'mock')

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() =>
      root!.render(
        <MemoryRouter>
          <StaffPage />
        </MemoryRouter>,
      ),
    )

    const card = container.querySelector('article')!
    expect(card.textContent).toContain('そば')
    expect(card.textContent).not.toContain('普通')
  })

  it('「売り切れ」タブで商品を売り切れにでき、もう一度押すと販売を再開する', async () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() =>
      root!.render(
        <MemoryRouter>
          <StaffPage />
        </MemoryRouter>,
      ),
    )
    const tab = [...container.querySelectorAll('[role="tab"]')].find((t) =>
      t.textContent?.includes('売り切れ'),
    ) as HTMLButtonElement
    act(() => tab.click())

    const toggle = () =>
      container!.querySelector('button[aria-label="たこ焼きを売り切れにする"], button[aria-label="たこ焼きの販売を再開する"]') as HTMLButtonElement
    expect(toggle().getAttribute('aria-pressed')).toBe('false')
    await act(async () => toggle().click())
    expect(toggle().getAttribute('aria-pressed')).toBe('true')
    let ids: string[] = []
    getSoldOutRepository().subscribe(todayKey(), (x) => (ids = x))()
    expect(ids).toContain('takoyaki')

    await act(async () => toggle().click())
    expect(toggle().getAttribute('aria-pressed')).toBe('false')
  })
})
