import { afterEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { ItemSheet } from './ItemSheet'
import { MENU } from '@/data/menu'
import type { OrderItem } from '@/types/order'

// React の act() をテスト環境で有効にする
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const kake = MENU.find((m) => m.id === 'kake')!

let root: Root | null = null
let container: HTMLDivElement | null = null

afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  root = null
  container = null
})

function render(onAdd: (line: OrderItem) => void): HTMLDivElement {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(<ItemSheet item={kake} onClose={() => {}} onAdd={onAdd} />))
  return container
}

function ctaButton(el: HTMLElement): HTMLButtonElement {
  const buttons = [...el.querySelectorAll('button')]
  return buttons[buttons.length - 1]
}

describe('商品シート（うどん・そば）', () => {
  it('麺を選ぶまでカートに入れられず、理由をボタンに出す', () => {
    const onAdd = vi.fn()
    const el = render(onAdd)
    const cta = ctaButton(el)
    expect(cta.disabled).toBe(true)
    expect(cta.textContent).toBe('麺を選んでください')
    act(() => cta.click())
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('そばを選ぶとカートに入れられる', () => {
    const onAdd = vi.fn()
    const el = render(onAdd)
    const soba = [...el.querySelectorAll('[role="radio"]')].find(
      (r) => r.textContent?.includes('そば'),
    ) as HTMLButtonElement
    act(() => soba.click())

    const cta = ctaButton(el)
    expect(cta.disabled).toBe(false)
    expect(cta.textContent).toContain('¥340')
    act(() => cta.click())
    expect(onAdd).toHaveBeenCalledOnce()
    expect(onAdd.mock.calls[0][0].key).toBe('kake|noodle:soba|size:regular')
  })
})
