import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { StaffAccountGate, StaffPage } from './StaffPage'
import type { LoginState } from '@/lib/auth'
import { STAFF_KEY } from '@/lib/gate'
import { getOrderRepository } from '@/lib/orders'
import { MENU } from '@/data/menu'
import { buildOrderItem } from '@/lib/menuOptions'
import { getSoldOutRepository } from '@/lib/soldOut'
import { todayKey } from '@/lib/orders/types'

// React の act() をテスト環境で有効にする
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const items = [{ name: 'カレーライス', price: 480, quantity: 1 }]

let root: Root | null = null
let container: HTMLDivElement | null = null

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(STAFF_KEY, '1')
})

afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  root = null
  container = null
})

describe('厨房ボード', () => {
  it('お持ち帰りの注文に「持ち帰り」、旧データ（利用方法なし）には何も付けずに表示する', async () => {
    const repo = getOrderRepository()
    await repo.createOrder({ items, total: 480, diningOption: 'takeout' }, 'mock')
    await repo.createOrder({ items, total: 480 }, 'mock')

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() =>
      root!.render(
        <MemoryRouter>
          <StaffPage />
        </MemoryRouter>,
      ),
    )

    const cards = container.querySelectorAll('article')
    expect(cards).toHaveLength(2)
    expect(cards[0].textContent).toContain('持ち帰り')
    expect(cards[1].textContent).not.toContain('持ち帰り')
    expect(cards[1].textContent).not.toContain('店内')
  })

  it('うどん・そばは、初期値のままの「普通」でも麺の種類を必ず出す', async () => {
    const kake = MENU.find((m) => m.id === 'kake')!
    const line = buildOrderItem(kake, { noodle: 'soba', size: 'regular' }, 1)
    await getOrderRepository().createOrder({ items: [line], total: line.price }, 'mock')

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() =>
      root!.render(
        <MemoryRouter>
          <StaffPage />
        </MemoryRouter>,
      ),
    )

    const card = container.querySelector('article')!
    expect(card.textContent).toContain('そば')
    expect(card.textContent).not.toContain('普通')
  })

  it('「売り切れ」タブで商品を売り切れにでき、もう一度押すと販売を再開する', async () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() =>
      root!.render(
        <MemoryRouter>
          <StaffPage />
        </MemoryRouter>,
      ),
    )
    const tab = [...container.querySelectorAll('[role="tab"]')].find((t) =>
      t.textContent?.includes('売り切れ'),
    ) as HTMLButtonElement
    act(() => tab.click())

    const toggle = () =>
      container!.querySelector('button[aria-label="たこ焼きを売り切れにする"], button[aria-label="たこ焼きの販売を再開する"]') as HTMLButtonElement
    expect(toggle().getAttribute('aria-pressed')).toBe('false')
    await act(async () => toggle().click())
    expect(toggle().getAttribute('aria-pressed')).toBe('true')
    let ids: string[] = []
    getSoldOutRepository().subscribe(todayKey(), (x) => (ids = x))()
    expect(ids).toContain('takoyaki')

    await act(async () => toggle().click())
    expect(toggle().getAttribute('aria-pressed')).toBe('false')
  })
})

describe('厨房ボードの料理の出し方', () => {
  it('ホットスナックは料理と分けて「ホットスナック」の下に出し、ネギ抜き・上の容器ありを目立たせる', async () => {
    const kake = MENU.find((m) => m.id === 'kake')!
    const takoyaki = MENU.find((m) => m.id === 'takoyaki')!
    const noodle = buildOrderItem(kake, { noodle: 'udon', size: 'regular', negi: 'without' }, 1)
    const snack = buildOrderItem(takoyaki, {}, 2)
    await getOrderRepository().createOrder(
      { items: [snack, noodle], total: noodle.price + snack.price * 2, diningOption: 'eat_in' },
      'mock',
    )

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() =>
      root!.render(
        <MemoryRouter>
          <StaffPage />
        </MemoryRouter>,
      ),
    )

    const card = container.querySelector('article')!
    const text = card.textContent!
    expect(text).toContain('ネギ抜き')
    expect(text.indexOf('かけうどん・そば')).toBeLessThan(text.indexOf('ホットスナック'))
    expect(text.indexOf('ホットスナック')).toBeLessThan(text.indexOf('たこ焼き'))
  })
})

describe('厨房ボードの予約と先生', () => {
  it('予約の注文に「予約 12:30」、先生の注文に「先生」と出し、予約は受け取りの15分前の順に並べる', async () => {
    const repo = getOrderRepository()
    const now = Date.now()
    const later = new Date(now + 3 * 60 * 60 * 1000)
    later.setMinutes(30, 0, 0)
    await repo.createOrder({ items, total: 480, pickupAt: later.getTime() }, 'mock')
    await repo.createOrder({ items, total: 480, orderer: 'teacher' }, 'mock')

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() =>
      root!.render(
        <MemoryRouter>
          <StaffPage />
        </MemoryRouter>,
      ),
    )
    const cards = container.querySelectorAll('article')
    expect(cards).toHaveLength(2)
    expect(cards[0].textContent).toContain('先生')
    expect(cards[1].textContent).toContain(`予約 ${later.getHours()}:30`)
  })
})

describe('利用状況（スタッフだけ）', () => {
  it('「利用状況」のタブで、今日の注文数・売上・人気メニューを出し、期間を切り替えられる', async () => {
    const repo = getOrderRepository()
    const a = await repo.createOrder({ items, total: 480, diningOption: 'eat_in' }, 'mock')
    await repo.updateStatus(a.id, 'completed')
    await repo.createOrder(
      { items: [{ menuItemId: 'takoyaki', name: 'たこ焼き', price: 270, quantity: 2 }], total: 540, diningOption: 'takeout' },
      'mock',
    )

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() =>
      root!.render(
        <MemoryRouter>
          <StaffPage />
        </MemoryRouter>,
      ),
    )
    const tab = [...container.querySelectorAll('[role="tab"]')].find((t) => t.textContent?.includes('利用状況')) as HTMLButtonElement
    await act(async () => tab.click())
    const panel = container.querySelector('[aria-label="利用状況"]')!
    expect(panel.textContent).toContain('注文数')
    expect(panel.textContent).toContain('2件')
    expect(panel.textContent).toContain('¥1,020')
    expect(panel.textContent).toContain('人気メニュー')
    expect(panel.textContent).toContain('たこ焼き')
    expect(panel.textContent).toContain('店内')
    expect(panel.textContent).toContain('持ち帰り')

    const week = [...panel.querySelectorAll('button')].find((b) => b.textContent === '7日間')!
    await act(async () => week.click())
    expect(week.getAttribute('aria-pressed')).toBe('true')
    expect(panel.textContent).toContain('日ごとの注文数')
  })
})

describe('厨房ボードの入口（スタッフのアカウント）', () => {
  function renderGate(login: LoginState, onSignOut = async () => {}, onGoogleSignIn = async () => {}) {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() =>
      root!.render(
        <MemoryRouter>
          <StaffAccountGate
            login={login}
            onSignIn={async () => {}}
            onGoogleSignIn={onGoogleSignIn}
            onSignOut={onSignOut}
          />
        </MemoryRouter>,
      ),
    )
    return container
  }

  it('ログインしていなければ、メールアドレスとパスワードの画面（合言葉は使わない）', () => {
    localStorage.setItem(STAFF_KEY, '1') // 昔の合言葉の記録があっても入れない
    const el = renderGate({ status: 'signedOut' })
    expect(el.querySelector('input[type="email"]')).not.toBeNull()
    expect(el.textContent).not.toContain('合言葉')
    expect(el.querySelectorAll('[role="tab"]')).toHaveLength(0)
  })

  it('学生のアカウントでは入れず、スタッフのアカウントでログインし直すよう伝える', () => {
    const el = renderGate({ status: 'signedIn', email: 'a@gl.pen-kanagawa.ed.jp', uid: 's1', student: true, staff: false })
    expect(el.querySelector('input[type="email"]')).not.toBeNull()
    expect(el.textContent).toContain('学生のアカウントでログインしています')
  })

  it('スタッフでログインしていれば厨房ボード。ログイン中のアカウントとログアウトを出す', async () => {
    let signedOut = false
    const el = renderGate(
      { status: 'signedIn', email: 'kitchen@example.com', uid: 'k1', student: false, staff: true },
      async () => {
        signedOut = true
      },
    )
    expect(el.querySelectorAll('[role="tab"]')).toHaveLength(3)
    expect(el.textContent).toContain('kitchen@example.com')
    const logout = [...el.querySelectorAll('button')].find((b) => b.textContent === 'ログアウト')!
    await act(async () => logout.click())
    expect(signedOut).toBe(true)
  })

  it('学校の Google アカウントでも、スタッフの名簿にあれば厨房ボードを使える（管理者）', () => {
    const el = renderGate({ status: 'signedIn', email: 'admin@gl.pen-kanagawa.ed.jp', uid: 'a1', student: true, staff: true })
    expect(el.querySelectorAll('[role="tab"]')).toHaveLength(3)
  })

  it('ログイン画面に「Google でログイン」があり、押すと Google でのログインを始める', async () => {
    let called = false
    const el = renderGate({ status: 'signedOut' }, async () => {}, async () => {
      called = true
    })
    const google = [...el.querySelectorAll('button')].find((b) => b.textContent?.includes('Google でログイン'))!
    await act(async () => google.click())
    expect(called).toBe(true)
  })
})
