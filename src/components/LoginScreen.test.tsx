import { afterEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { LoginScreen } from './LoginScreen'
import { LoginError } from '@/lib/auth'

// React の act() をテスト環境で有効にする
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let container: HTMLDivElement | null = null

afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  root = null
  container = null
})

function render(onSignIn: () => Promise<void>): HTMLDivElement {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() =>
    root!.render(
      <MemoryRouter>
        <LoginScreen domain="gl.pen-kanagawa.ed.jp" onSignIn={onSignIn} />
      </MemoryRouter>,
    ),
  )
  return container
}

function googleButton(el: HTMLElement): HTMLButtonElement {
  return [...el.querySelectorAll('button')].find((b) =>
    b.textContent?.includes('Google'),
  ) as HTMLButtonElement
}

describe('ログイン画面（学校の Google アカウント）', () => {
  it('どのアカウントでログインするかを出す', () => {
    const el = render(async () => {})
    expect(el.textContent).toContain('@gl.pen-kanagawa.ed.jp')
  })

  it('ほかのドメインのアカウントだったら、学校のアカウントで入るよう伝える', async () => {
    const el = render(async () => {
      throw new LoginError('wrong-domain')
    })
    await act(async () => googleButton(el).click())
    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      '@gl.pen-kanagawa.ed.jp のアカウントでログインしてください',
    )
  })

  it('ログインの窓を閉じただけなら、エラーは出さない', async () => {
    const el = render(async () => {
      throw new LoginError('cancelled')
    })
    await act(async () => googleButton(el).click())
    expect(el.querySelector('[role="alert"]')).toBeNull()
  })
})

describe('ログイン画面のお知らせ', () => {
  it('お知らせ（PayPay から戻ったとき等）を出す', () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() =>
      root!.render(
        <MemoryRouter>
          <LoginScreen
            domain="gl.pen-kanagawa.ed.jp"
            onSignIn={async () => {}}
            notice="ログインすると、注文の登録を続けます。"
          />
        </MemoryRouter>,
      ),
    )
    expect(container.textContent).toContain('ログインすると、注文の登録を続けます。')
  })

  it('停止されたアカウント・通信の失敗も伝える', async () => {
    const el = render(async () => {
      throw new LoginError('network')
    })
    await act(async () => googleButton(el).click())
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('インターネット')
  })
})
