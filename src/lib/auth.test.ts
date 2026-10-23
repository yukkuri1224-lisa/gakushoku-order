import { describe, expect, it } from 'vitest'
import { isAllowedEmail } from './auth'

describe('ログインできるアカウント', () => {
  const domain = 'gl.pen-kanagawa.ed.jp'

  it('指定したドメインのアカウントだけ通す（大文字小文字は区別しない）', () => {
    expect(isAllowedEmail('0191xxxx@gl.pen-kanagawa.ed.jp', domain)).toBe(true)
    expect(isAllowedEmail('Student@GL.Pen-Kanagawa.ed.jp', domain)).toBe(true)
  })

  it('gmail や、似た名前のドメインは通さない', () => {
    expect(isAllowedEmail('someone@gmail.com', domain)).toBe(false)
    expect(isAllowedEmail('x@pen-kanagawa.ed.jp', domain)).toBe(false)
    expect(isAllowedEmail('x@evil-gl.pen-kanagawa.ed.jp', domain)).toBe(false)
    expect(isAllowedEmail('gl.pen-kanagawa.ed.jp@gmail.com', domain)).toBe(false)
    expect(isAllowedEmail(null, domain)).toBe(false)
  })
})
