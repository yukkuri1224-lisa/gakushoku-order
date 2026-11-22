import { afterEach, describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { NotifyCardView } from './NotifyCard'
import type { PushState } from '@/lib/push'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let container: HTMLDivElement | null = null

afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  root = null
  container = null
})

function render(state: PushState, onEnable = async () => {}) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(<NotifyCardView state={state} onEnable={onEnable} />))
  return container
}

describe('調理完了の通知のカード', () => {
  it('まだなら「できあがったらスマホに通知する」ボタンを出し、押すと許可を求める', async () => {
    let asked = false
    const el = render('default', async () => {
      asked = true
    })
    const button = el.querySelector('button')!
    expect(button.textContent).toContain('できあがったらスマホに通知する')
    await act(async () => button.click())
    expect(asked).toBe(true)
  })

  it('許可済みなら、通知でお知らせすると伝える', () => {
    expect(render('granted').textContent).toContain('通知でお知らせします')
  })

  it('ブロックされていれば、設定から許可するよう伝える', () => {
    expect(render('denied').textContent).toContain('設定')
  })

  it('iPhone でホーム画面に追加していなければ、追加すると届くと伝える', () => {
    expect(render('needs-install').textContent).toContain('ホーム画面に追加')
  })

  it('使えないブラウザでは何も出さない', () => {
    expect(render('unsupported').textContent).toBe('')
  })
})
