import { afterEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { Toast } from './Toast'
import { useToast } from '@/store/toast'

// React の act() をテスト環境で有効にする
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let container: HTMLDivElement | null = null
let navigate: ((to: string) => void) | null = null

function NavigateCapture() {
  navigate = useNavigate()
  return null
}

afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  useToast.setState({ message: null })
})

describe('Toast', () => {
  it('画面が切り替わったらお知らせを消す', () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() =>
      root!.render(
        <MemoryRouter initialEntries={['/menu']}>
          <NavigateCapture />
          <Toast />
        </MemoryRouter>,
      ),
    )

    act(() => useToast.getState().show('カートに追加しました'))
    expect(container.textContent).toContain('カートに追加しました')

    act(() => navigate!('/checkout'))
    expect(container.textContent).not.toContain('カートに追加しました')
  })
})
