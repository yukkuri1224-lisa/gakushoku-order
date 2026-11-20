import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { MenuPage } from './MenuPage'
import { useCartStore } from '@/store/cart'
import { useDiningStore } from '@/store/dining'
import { getSoldOutRepository } from '@/lib/soldOut'
import { todayKey } from '@/lib/orders/types'

// React の act() をテスト環境で有効にする
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let container: HTMLDivElement | null = null

beforeEach(() => {
  localStorage.clear()
  useCartStore.setState({ items: [] })
  useDiningStore.setState({ option: 'eat_in' })
})

afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  root = null
  container = null
})

function render(): HTMLDivElement {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() =>
    root!.render(
      <MemoryRouter initialEntries={['/menu']}>
        <MenuPage />
      </MemoryRouter>,
    ),
  )
  return container
}

function chip(el: HTMLElement, label: string): HTMLButtonElement {
  const group = el.querySelector('[aria-label="ジャンル"]')!
  return [...group.querySelectorAll('button')].find(
    (b) => b.textContent === label,
  ) as HTMLButtonElement
}

function tab(el: HTMLElement, label: string): HTMLButtonElement {
  return [...el.querySelectorAll('[role="tab"]')].find(
    (b) => b.textContent?.includes(label),
  ) as HTMLButtonElement
}

// React が管理する input に値を入れる
function type(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  act(() => {
    setter.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

const searchBox = (el: HTMLElement) => el.querySelector('input[type="search"]') as HTMLInputElement

describe('メニュー画面の枠とジャンル', () => {
  it('「食堂メニュー」と「ホットスナック」の枠に分け、最初は食堂メニュー（ジャンルは すべて・定食・麺類・カレー）', () => {
    const el = render()
    expect(tab(el, '食堂メニュー').getAttribute('aria-selected')).toBe('true')
    expect(tab(el, 'ホットスナック').getAttribute('aria-selected')).toBe('false')
    const group = el.querySelector('[aria-label="ジャンル"]')!
    expect([...group.querySelectorAll('button')].map((b) => b.textContent)).toEqual([
      'すべて',
      '定食',
      '麺類',
      'カレー',
    ])
    expect(chip(el, 'すべて').getAttribute('aria-pressed')).toBe('true')
    expect(el.textContent).toContain('ランチA')
    expect(el.textContent).not.toContain('たこ焼き')
  })

  it('ホットスナックの枠では、ホットスナックだけを出す', () => {
    const el = render()
    act(() => tab(el, 'ホットスナック').click())
    expect(tab(el, 'ホットスナック').getAttribute('aria-selected')).toBe('true')
    expect(el.textContent).toContain('たこ焼き')
    expect(el.textContent).toContain('フライドポテト')
    expect(el.textContent).not.toContain('ラーメン')
    expect(el.querySelector('[aria-label="ジャンル"]')).toBeNull()
  })

  it('ジャンルを選ぶと、そのジャンルの料理だけを出す', () => {
    const el = render()
    act(() => chip(el, 'カレー').click())
    expect(chip(el, 'カレー').getAttribute('aria-pressed')).toBe('true')
    expect(el.textContent).toContain('カツカレー')
    expect(el.textContent).not.toContain('ラーメン')

    act(() => chip(el, 'すべて').click())
    expect(el.textContent).toContain('ラーメン')
  })

  it('売り切れの商品は「売り切れ」と出し、押せない', async () => {
    await getSoldOutRepository().setSoldOut(todayKey(), 'takoyaki', true)
    const el = render()
    act(() => tab(el, 'ホットスナック').click())
    const card = [...el.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('たこ焼き'),
    )!
    expect(card.disabled).toBe(true)
    expect(card.textContent).toContain('売り切れ')
    await act(() => getSoldOutRepository().setSoldOut(todayKey(), 'takoyaki', false))
    expect(card.disabled).toBe(false)
  })
})

describe('メニュー検索', () => {
  it('食堂メニューとホットスナックの両方から探し、件数を出す', () => {
    const el = render()
    type(searchBox(el), 'からあげ')
    expect(el.textContent).toContain('唐揚カレー')
    expect(el.textContent).toContain('から揚げ')
    expect(el.textContent).toContain('2件')
    expect(el.textContent).not.toContain('ランチA')
    expect(el.querySelector('[role="tab"]')).toBeNull()
  })

  it('見つからなければそう伝え、消すと元の一覧に戻る', () => {
    const el = render()
    type(searchBox(el), 'ぴざ')
    expect(el.textContent).toContain('見つかりませんでした')
    type(searchBox(el), '')
    expect(el.textContent).toContain('ランチA')
    expect(tab(el, '食堂メニュー')).toBeTruthy()
  })
})

describe('お持ち帰りの価格', () => {
  it('料理は下の容器（20円）込みの価格で出し、そのことを書いておく。ホットスナックはそのまま', () => {
    useDiningStore.setState({ option: 'takeout' })
    const el = render()
    const card = (name: string) =>
      [...el.querySelectorAll('button')].find((b) => b.textContent?.includes(name))!
    expect(card('カレーライス').textContent).toContain('¥500')
    expect(el.textContent).toContain('容器代（20円）込み')
    act(() => tab(el, 'ホットスナック').click())
    expect(card('たこ焼き').textContent).toContain('¥270')
  })

  it('店内で食べるときは、いつもの価格', () => {
    const el = render()
    const card = [...el.querySelectorAll('button')].find((b) => b.textContent?.includes('カレーライス'))!
    expect(card.textContent).toContain('¥480')
    expect(el.textContent).not.toContain('容器代（20円）込み')
  })
})
