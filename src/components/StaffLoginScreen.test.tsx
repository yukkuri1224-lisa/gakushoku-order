import { afterEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { StaffLoginScreen } from './StaffLoginScreen'
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

function render(
  onSignIn: (email: string, password: string) => Promise<void>,
  notice?: string,
): HTMLDivElement {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() =>
    root!.render(
      <MemoryRouter>
        <StaffLoginScreen onSignIn={onSignIn} notice={notice} />
      </MemoryRouter>,
    ),
  )
  return container
}

// React が管理する input に値を入れる（value の setter を通して input イベントを出す）
function type(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  act(() => {
    setter.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

const emailInput = (el: HTMLElement) => el.querySelector('input[type="email"]') as HTMLInputElement
const passwordInput = (el: HTMLElement) => el.querySelector('#staff-password') as HTMLInputElement
const submit = async (el: HTMLElement) => {
  const button = [...el.querySelectorAll('button')].find((b) => b.type === 'submit')!
  await act(async () => button.click())
}

describe('スタッフのログイン画面', () => {
  it('メールアドレスとパスワードでログインする（前後の空白は除く）', async () => {
    const calls: [string, string][] = []
    const el = render(async (email, password) => {
      calls.push([email, password])
    })
    type(emailInput(el), '  kitchen@example.com ')
    type(passwordInput(el), 'correct horse battery')
    await submit(el)
    expect(calls).toEqual([['kitchen@example.com', 'correct horse battery']])
  })

  it('パスワード欄はふだん伏せ字で、「表示」で確かめられる', () => {
    const el = render(async () => {})
    expect(passwordInput(el).type).toBe('password')
    const toggle = [...el.querySelectorAll('button')].find((b) => b.textContent === '表示')!
    act(() => toggle.click())
    expect(passwordInput(el).type).toBe('text')
  })

  it('間違えたときは、どちらが違うかを言わずに伝え、パスワードだけ消す', async () => {
    const el = render(async () => {
      throw new LoginError('wrong-password')
    })
    type(emailInput(el), 'kitchen@example.com')
    type(passwordInput(el), 'nope')
    await submit(el)
    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      'メールアドレスかパスワードが違います',
    )
    expect(emailInput(el).value).toBe('kitchen@example.com')
    expect(passwordInput(el).value).toBe('')
  })

  it('スタッフの名簿にないアカウント・間違えすぎも伝える', async () => {
    let code: 'not-staff' | 'too-many' = 'not-staff'
    const el = render(async () => {
      throw new LoginError(code)
    })
    type(emailInput(el), 'someone@example.com')
    type(passwordInput(el), 'x')
    await submit(el)
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('厨房ボードを使えません')

    code = 'too-many'
    type(passwordInput(el), 'y')
    await submit(el)
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('しばらくログインできません')
  })

  it('空のままでは送らない', async () => {
    let called = false
    const el = render(async () => {
      called = true
    })
    await submit(el)
    expect(called).toBe(false)
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('入れてください')
  })

  it('お知らせがあれば出す', () => {
    const el = render(async () => {}, '学生のアカウントでログイン中です。')
    expect(el.textContent).toContain('学生のアカウントでログイン中です。')
  })
})
