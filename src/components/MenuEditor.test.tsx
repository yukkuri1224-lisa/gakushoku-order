import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MENU } from '@/data/menu'
import { startMenuSync, useMenuStore } from '@/store/menu'
import { MenuEditor } from './MenuEditor'

// React の act() をテスト環境で有効にする
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let container: HTMLDivElement | null = null

beforeEach(() => {
  localStorage.clear()
  startMenuSync()
  useMenuStore.setState({
    items: MENU,
    sortOrders: Object.fromEntries(MENU.map((m, i) => [m.id, i])),
    custom: false,
  })
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
  act(() => root!.render(<MenuEditor />))
  return container
}

const button = (el: HTMLElement, text: string) =>
  [...el.querySelectorAll('button')].find((b) => b.textContent?.trim() === text || b.getAttribute('aria-label') === text) as HTMLButtonElement

function type(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')!.set!
  act(() => {
    setter.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function choose(select: HTMLSelectElement, value: string) {
  act(() => {
    select.value = value
    select.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

const dialog = () => document.querySelector('[role="dialog"]') as HTMLElement
const field = (id: string) => dialog().querySelector(`#${id}`) as HTMLInputElement
const item = (id: string) => useMenuStore.getState().items.find((m) => m.id === id)

describe('メニュー管理', () => {
  it('ジャンルごとに商品を並べ、値段も出す', () => {
    const el = render()
    expect(el.textContent).toContain('定食')
    expect(el.textContent).toContain('ホットスナック')
    expect(el.textContent).toContain('カレーライス')
    expect(el.textContent).toContain('¥480')
  })

  it('新しいメニューを追加できる（選択肢も付けられる）', async () => {
    const el = render()
    act(() => button(el, '＋ メニューを追加').click())
    type(field('menu-name'), '親子丼')
    type(field('menu-price'), '450')
    choose(dialog().querySelector('#menu-category') as HTMLSelectElement, '定食')
    act(() => (dialog().querySelector('input[value="size"]') as HTMLInputElement).click())
    await act(async () => button(dialog(), '保存').click())
    const added = useMenuStore.getState().items.find((m) => m.name === '親子丼')!
    expect(added.price).toBe(450)
    expect(added.category).toBe('定食')
    expect(added.optionGroups?.map((g) => g.id)).toEqual(['size'])
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })

  it('名前や値段がおかしいと保存せず、理由を出す', async () => {
    const el = render()
    act(() => button(el, '＋ メニューを追加').click())
    type(field('menu-price'), 'abc')
    await act(async () => button(dialog(), '保存').click())
    expect(dialog().textContent).toContain('名前を入れてください')
    expect(dialog().textContent).toContain('値段は')
    expect(useMenuStore.getState().custom).toBe(false)
  })

  it('値段を変えられる', async () => {
    const el = render()
    act(() => button(el, 'カレーライスを編集').click())
    expect(field('menu-price').value).toBe('480')
    type(field('menu-price'), '500')
    await act(async () => button(dialog(), '保存').click())
    expect(item('curry')?.price).toBe(500)
  })

  it('「メニューに出さない」にでき、一覧に「非表示」と出る', async () => {
    const el = render()
    act(() => button(el, 'ランチAを編集').click())
    act(() => field('menu-hidden').click())
    await act(async () => button(dialog(), '保存').click())
    expect(item('lunch_a')?.hidden).toBe(true)
    expect(el.textContent).toContain('非表示')
  })

  it('削除は確かめてから', async () => {
    const el = render()
    act(() => button(el, 'フライドポテトを編集').click())
    act(() => button(dialog(), '削除').click())
    expect(item('fries')).toBeDefined()
    await act(async () => button(dialog(), '本当に削除する').click())
    expect(item('fries')).toBeUndefined()
  })

  it('同じジャンルの中で順番を変えられる', async () => {
    const el = render()
    await act(async () => button(el, 'ランチAを下へ').click())
    expect(useMenuStore.getState().items.slice(0, 2).map((m) => m.id)).toEqual(['lunch_b', 'lunch_a'])
    expect(button(el, 'ランチBを上へ').disabled).toBe(true)
  })
})
