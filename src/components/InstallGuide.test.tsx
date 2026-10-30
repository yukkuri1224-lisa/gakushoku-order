import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { InstallGuide } from './InstallGuide'

// React の act() をテスト環境で有効にする
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let container: HTMLDivElement | null = null

function render(): HTMLDivElement {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(<InstallGuide />))
  return container
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  root = null
  container = null
  vi.restoreAllMocks()
})

describe('ホーム画面に追加の案内', () => {
  it('iPhone では共有ボタンからの手順を出し、閉じたら次から出さない', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
    )
    const el = render()
    expect(el.textContent).toContain('「ホーム画面に追加」を選ぶ')

    act(() => (el.querySelector('button[aria-label="案内を閉じる"]') as HTMLButtonElement).click())
    expect(el.textContent).toBe('')
    act(() => root?.unmount())
    container?.remove()
    expect(render().textContent).toBe('')
  })

  it('パソコンでは出さない', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141.0.0.0 Safari/537.36',
    )
    expect(render().textContent).toBe('')
  })
})
