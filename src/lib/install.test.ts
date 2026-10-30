import { describe, expect, it } from 'vitest'
import { installMethod } from './install'

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const ANDROID =
  'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36'
const WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'

describe('ホーム画面への追加の案内', () => {
  it('ホーム画面から開いているときは案内しない', () => {
    expect(installMethod({ ua: IPHONE, standalone: true, canPrompt: false, touchMac: false })).toBe(
      'installed',
    )
  })

  it('Android の Chrome など、追加ボタンを出せるブラウザではボタンで追加する', () => {
    expect(installMethod({ ua: ANDROID, standalone: false, canPrompt: true, touchMac: false })).toBe(
      'prompt',
    )
  })

  it('iPhone・iPad では、共有ボタンからの手順を出す', () => {
    expect(installMethod({ ua: IPHONE, standalone: false, canPrompt: false, touchMac: false })).toBe(
      'ios',
    )
    // iPad は Mac と同じ名乗りをするので、タッチできるかで見分ける
    expect(installMethod({ ua: WINDOWS, standalone: false, canPrompt: false, touchMac: true })).toBe(
      'ios',
    )
  })

  it('それ以外（パソコンなど）は案内しない', () => {
    expect(installMethod({ ua: WINDOWS, standalone: false, canPrompt: false, touchMac: false })).toBe(
      'none',
    )
  })
})
