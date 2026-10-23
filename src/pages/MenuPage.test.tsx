import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { MenuPage } from './MenuPage'
import { useCartStore } from '@/store/cart'
import { useDiningStore } from '@/store/dining'

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

describe('メニュー画面のジャンル', () => {
  it('ジャンルの絞り込みを すべて・定食・麺類・カレー・軽食 で出し、最初は「すべて」', () => {
    const el = render()
    const group = el.querySelector('[aria-label="ジャンル"]')!
    expect([...group.querySelectorAll('button')].map((b) => b.textContent)).toEqual([
      'すべて',
      '定食',
      '麺類',
      'カレー',
      '軽食',
    ])
    expect(chip(el, 'すべて').getAttribute('aria-pressed')).toBe('true')
    expect(el.textContent).toContain('ランチA')
    expect(el.textContent).toContain('たこ焼き')
  })

  it('ジャンルを選ぶと、そのジャンルの商品だけを出す', () => {
    const el = render()
    act(() => chip(el, '軽食').click())
    expect(chip(el, '軽食').getAttribute('aria-pressed')).toBe('true')
    expect(chip(el, 'すべて').getAttribute('aria-pressed')).toBe('false')
    expect(el.textContent).toContain('たこ焼き')
    expect(el.textContent).not.toContain('醤油ラーメン')

    act(() => chip(el, 'すべて').click())
    expect(el.textContent).toContain('醤油ラーメン')
  })
})
