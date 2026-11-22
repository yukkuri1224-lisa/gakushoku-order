import { describe, expect, it } from 'vitest'
import { pushStateFrom } from './push'

const base = { enabled: true, supported: true, ios: false, standalone: false, permission: 'default' as NotificationPermission }

describe('調理完了の通知が使えるか', () => {
  it('設定がない（デモ・鍵なし）なら使えない', () => {
    expect(pushStateFrom({ ...base, enabled: false })).toBe('unsupported')
  })

  it('許可の状態をそのまま返す', () => {
    expect(pushStateFrom(base)).toBe('default')
    expect(pushStateFrom({ ...base, permission: 'granted' })).toBe('granted')
    expect(pushStateFrom({ ...base, permission: 'denied' })).toBe('denied')
  })

  it('iPhone はホーム画面に追加するまで使えない（追加を案内する）', () => {
    expect(pushStateFrom({ ...base, ios: true, supported: false })).toBe('needs-install')
    expect(pushStateFrom({ ...base, ios: true, supported: true, standalone: true })).toBe('default')
  })

  it('通知に対応していないブラウザ（iPhone 以外）は使えない', () => {
    expect(pushStateFrom({ ...base, supported: false })).toBe('unsupported')
  })
})
