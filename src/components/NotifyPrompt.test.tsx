import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { NotifyPrompt, NotifyPromptView, shouldPromptNotify } from './NotifyPrompt'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let container: HTMLDivElement | null = null

beforeEach(() => sessionStorage.clear())
afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  root = null
  container = null
})

function render(node: React.ReactNode) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(node))
  return container
}

describe('ログインしたときの「通知を受け取りますか？」', () => {
  it('まだ決めていない（許可もブロックもしていない）ときだけ、ログインのたびに 1 回聞く', () => {
    expect(shouldPromptNotify('default', false)).toBe(true)
    expect(shouldPromptNotify('default', true)).toBe(false)
    expect(shouldPromptNotify('granted', false)).toBe(false)
    expect(shouldPromptNotify('denied', false)).toBe(false)
    expect(shouldPromptNotify('needs-install', false)).toBe(false)
    expect(shouldPromptNotify('unsupported', false)).toBe(false)
  })

  it('「通知を受け取る」で許可を求め、「あとで」で閉じる', async () => {
    let enabled = 0
    let later = 0
    const el = render(
      <NotifyPromptView
        onEnable={async () => {
          enabled++
        }}
        onLater={() => {
          later++
        }}
      />,
    )
    expect(el.querySelector('[role="dialog"]')?.textContent).toContain('通知を受け取りますか')
    const btn = (t: string) => [...el.querySelectorAll('button')].find((b) => b.textContent === t)!
    await act(async () => btn('通知を受け取る').click())
    act(() => btn('あとで').click())
    expect(enabled).toBe(1)
    expect(later).toBe(1)
  })

  it('通知が使えないとき（デモ・対応していないブラウザ）は何も出さない', () => {
    const el = render(<NotifyPrompt />)
    expect(el.querySelector('[role="dialog"]')).toBeNull()
  })
})
