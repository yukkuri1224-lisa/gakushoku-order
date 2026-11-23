import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { DiningPage } from './DiningPage'

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

describe('ご利用方法の画面', () => {
  it('あいさつと、選ぶボタンの説明文は出さない。店内の「席を確保してからご注文ください」は出す', () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() =>
      root!.render(
        <MemoryRouter>
          <DiningPage />
        </MemoryRouter>,
      ),
    )
    const text = container.textContent!
    for (const g of ['おはようございます', 'こんにちは', 'こんばんは']) expect(text).not.toContain(g)
    expect(text).not.toContain('食堂の席で食べられます')
    expect(text).not.toContain('お持ち帰り用にご用意します')
    expect(text).toContain('店内で食べる')
    expect(text).toContain('お持ち帰り')
    expect(text).toContain('席を確保してからご注文ください')
  })
})
