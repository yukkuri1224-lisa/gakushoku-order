import { afterEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { StudentAccountGate } from './RequireLogin'
import type { LoginState } from '@/lib/auth'

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

function render(login: LoginState, notice?: string): HTMLDivElement {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() =>
    root!.render(
      <MemoryRouter>
        <StudentAccountGate login={login} onSignIn={async () => {}} notice={notice}>
          <p>メニュー</p>
        </StudentAccountGate>
      </MemoryRouter>,
    ),
  )
  return container
}

const signedIn = (role: 'student' | 'staff'): LoginState => ({
  status: 'signedIn',
  email: role === 'student' ? '0191xxxx@gl.pen-kanagawa.ed.jp' : 'kitchen@example.com',
  uid: 'u1',
  role,
})

describe('学生の画面の入口（アカウントでのログイン）', () => {
  it('学校のアカウントでログインしていれば、そのまま中身を出す', () => {
    const el = render(signedIn('student'))
    expect(el.textContent).toContain('メニュー')
  })

  it('ログインしていなければ、その場でログイン画面を出す（ログイン後は同じ画面に戻れる）', () => {
    const el = render({ status: 'signedOut' }, 'ログインすると、注文の登録を続けます。')
    expect(el.textContent).not.toContain('メニュー')
    expect(el.textContent).toContain('Google でログイン')
    expect(el.textContent).toContain('ログインすると、注文の登録を続けます。')
  })

  it('スタッフのアカウントでは学生の画面に入れず、そう伝える', () => {
    const el = render(signedIn('staff'))
    expect(el.textContent).not.toContain('メニュー')
    expect(el.textContent).toContain('食堂スタッフのアカウントでログインしています')
  })

  it('確かめている間は読み込み中', () => {
    const el = render({ status: 'loading' })
    expect(el.textContent).toContain('読み込み中')
    expect(el.textContent).not.toContain('メニュー')
  })
})
