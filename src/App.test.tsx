import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { GATE_KEY } from '@/lib/gate'
import { useDiningStore } from '@/store/dining'

// React の act() をテスト環境で有効にする
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let container: HTMLDivElement | null = null

function renderAt(path: string): string {
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
  return container.textContent ?? ''
}

beforeEach(() => {
  localStorage.clear()
  useDiningStore.setState({ option: null })
})

afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  root = null
  container = null
})

describe('最初の画面の振り分け', () => {
  it('合言葉を入れた人が / を開くと、ご利用方法の選択画面になる', () => {
    localStorage.setItem(GATE_KEY, '1')
    expect(renderAt('/')).toContain('ご利用方法を選んでください')
  })

  it('ご利用方法が未選択なら /menu から選択画面へ戻す', () => {
    localStorage.setItem(GATE_KEY, '1')
    expect(renderAt('/menu')).toContain('ご利用方法を選んでください')
  })

  it('選択済みなら /menu でメニューを表示する', () => {
    localStorage.setItem(GATE_KEY, '1')
    useDiningStore.setState({ option: 'takeout' })
    const text = renderAt('/menu')
    expect(text).toContain('ラーメン')
    expect(text).not.toContain('ご利用方法を選んでください')
  })

  it('合言葉がまだなら /start から合言葉の画面へ戻す', () => {
    expect(renderAt('/start')).toContain('合言葉')
  })
})
