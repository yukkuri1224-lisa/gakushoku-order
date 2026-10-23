import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { CheckoutPage } from './CheckoutPage'
import { MENU } from '@/data/menu'
import { buildOrderItem, defaultSelection } from '@/lib/menuOptions'
import { useCartStore } from '@/store/cart'
import { useDiningStore } from '@/store/dining'
import { getSoldOutRepository } from '@/lib/soldOut'
import { todayKey } from '@/lib/orders/types'

// React の act() をテスト環境で有効にする
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const ramen = MENU.find((m) => m.id === 'ramen')!

let root: Root | null = null
let container: HTMLDivElement | null = null

function render(): HTMLDivElement {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() =>
    root!.render(
      <MemoryRouter initialEntries={['/checkout']}>
        <CheckoutPage />
      </MemoryRouter>,
    ),
  )
  return container
}

function findButton(el: HTMLElement, text: string): HTMLButtonElement | undefined {
  return [...el.querySelectorAll('button')].find((b) =>
    b.textContent?.includes(text),
  )
}

beforeEach(() => {
  localStorage.clear()
  useCartStore.setState({ items: [buildOrderItem(ramen, defaultSelection(ramen), 2)] })
  useDiningStore.setState({ option: null })
})

afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  root = null
  container = null
})

describe('注文内容の確認', () => {
  it('ご利用方法が未選択なら支払いボタンを押せず、理由を表示する', () => {
    const el = render()
    const button = findButton(el, 'ご利用方法を選んでください')
    expect(button).toBeDefined()
    expect(button!.disabled).toBe(true)
  })

  it('ご利用方法を選ぶと支払えるようになり、最下部に場所と利用方法が出る', () => {
    const el = render()
    const takeout = [...el.querySelectorAll('[role="radio"]')].find((b) =>
      b.textContent?.includes('お持ち帰り'),
    ) as HTMLButtonElement
    act(() => takeout.click())
    expect(useDiningStore.getState().option).toBe('takeout')
    expect(findButton(el, 'で支払う')!.disabled).toBe(false)
    expect(el.textContent).toContain('LiSA校食堂（お持ち帰り）')
  })

  it('選んだ内容をタグで表示し、合計を税込で表示する', () => {
    const el = render()
    expect(el.textContent).toContain('ご注文内容（2点）')
    expect(el.querySelector('[aria-label="選んだ内容"]')?.textContent).toContain('普通')
    expect(el.textContent).toContain('合計（税込）')
  })

  it('カートに売り切れの商品があると支払えず、その商品に「売り切れ」と出す', async () => {
    useDiningStore.setState({ option: 'eat_in' })
    await getSoldOutRepository().setSoldOut(todayKey(), 'ramen', true)
    const el = render()
    const button = findButton(el, '売り切れの商品を削除してください')
    expect(button).toBeDefined()
    expect(button!.disabled).toBe(true)
    expect(el.querySelector('[aria-label="選んだ内容"]')?.closest('li')?.textContent).toContain(
      '売り切れ',
    )
    await act(() => getSoldOutRepository().setSoldOut(todayKey(), 'ramen', false))
  })
})
