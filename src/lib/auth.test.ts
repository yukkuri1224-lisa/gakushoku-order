import { describe, expect, it } from 'vitest'
import { isAllowedEmail, loginErrorFromCode, resolveRoles } from './auth'

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

describe('ログインしたアカウントの役割', () => {
  const domain = 'gl.pen-kanagawa.ed.jp'
  const student = {
    uid: 's1',
    email: '0191xxxx@gl.pen-kanagawa.ed.jp',
    emailVerified: true,
    providerIds: ['google.com'],
  }
  const staffAccount = {
    uid: 'k1',
    email: 'kitchen@example.com',
    emailVerified: false,
    providerIds: ['password'],
  }
  const noStaff = async () => 'no' as const
  const yesStaff = async () => 'yes' as const

  it('学校の Google アカウントは学生。名簿になければスタッフではない', async () => {
    expect(await resolveRoles(student, domain, noStaff)).toEqual({ student: true, staff: false })
  })

  it('学校の Google アカウントでも、名簿にあれば学生とスタッフの両方（管理者など）', async () => {
    expect(await resolveRoles(student, domain, yesStaff)).toEqual({ student: true, staff: true })
  })

  it('名簿にあるパスワードのアカウントはスタッフだけ', async () => {
    expect(await resolveRoles(staffAccount, domain, yesStaff)).toEqual({ student: false, staff: true })
  })

  it('どちらでもなければ入れない（gmail・メール未確認・パスワードで作った学校のアドレス）', async () => {
    expect(await resolveRoles({ ...student, email: 'a@gmail.com' }, domain, noStaff)).toBe('none')
    expect(await resolveRoles({ ...student, emailVerified: false }, domain, noStaff)).toBe('none')
    expect(await resolveRoles({ ...student, providerIds: ['password'] }, domain, noStaff)).toBe('none')
    expect(await resolveRoles(staffAccount, domain, noStaff)).toBe('none')
  })

  it('名簿を調べられなかった（通信が切れている等）とき、学生はそのまま入れ、ほかは決めつけずに「わからない」', async () => {
    const error = async () => 'error' as const
    expect(await resolveRoles(student, domain, error)).toEqual({ student: true, staff: false })
    expect(await resolveRoles(staffAccount, domain, error)).toBe('unknown')
  })
})

describe('ログインのエラーの見分け', () => {
  it('メールアドレス・パスワードの間違いは、どちらが違うかを言わずにまとめる', () => {
    for (const code of [
      'auth/invalid-credential',
      'auth/wrong-password',
      'auth/user-not-found',
      'auth/invalid-email',
      'auth/missing-password',
    ]) {
      expect(loginErrorFromCode(code)).toBe('wrong-password')
    }
  })

  it('間違えすぎ・停止中・通信・設定・取り消しを見分ける', () => {
    expect(loginErrorFromCode('auth/too-many-requests')).toBe('too-many')
    expect(loginErrorFromCode('auth/user-disabled')).toBe('disabled')
    expect(loginErrorFromCode('auth/network-request-failed')).toBe('network')
    expect(loginErrorFromCode('auth/operation-not-allowed')).toBe('not-configured')
    expect(loginErrorFromCode('auth/configuration-not-found')).toBe('not-configured')
    expect(loginErrorFromCode('auth/unauthorized-domain')).toBe('not-configured')
    expect(loginErrorFromCode('auth/popup-closed-by-user')).toBe('cancelled')
    expect(loginErrorFromCode('auth/cancelled-popup-request')).toBe('cancelled')
    expect(loginErrorFromCode('auth/something-else')).toBe('unknown')
  })
})
