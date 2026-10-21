import { describe, expect, it } from 'vitest'
import { toUserMessage } from './errors'

const SETUP_MESSAGE =
  'お店のシステム設定に問題があります。スタッフにお知らせください。'

describe('toUserMessage', () => {
  it('Firestore の権限エラー（code）は日本語の案内に置き換える', () => {
    const e = Object.assign(new Error('Missing or insufficient permissions.'), {
      code: 'permission-denied',
    })
    expect(toUserMessage(e)).toBe(SETUP_MESSAGE)
  })

  it('code が無くても権限エラーの英文なら置き換える', () => {
    expect(toUserMessage(new Error('Missing or insufficient permissions.'))).toBe(
      SETUP_MESSAGE,
    )
  })

  it('それ以外の Error はメッセージをそのまま返す', () => {
    expect(toUserMessage(new Error('通信に失敗しました'))).toBe('通信に失敗しました')
  })

  it('Error 以外は汎用の文言', () => {
    expect(toUserMessage('x')).toBe('エラーが発生しました')
  })
})
