import { describe, expect, it } from 'vitest'
import { soldOutDocId, SOLD_OUT_COLLECTION } from './firestore'

describe('売り切れの保存場所（Firestore）', () => {
  it('いまのルールのまま読み書きできる dailyCounters に、日付ごとの別の記録として置く', () => {
    expect(SOLD_OUT_COLLECTION).toBe('dailyCounters')
    expect(soldOutDocId('2026-10-30')).toBe('soldOut-2026-10-30')
  })

  it('注文番号の採番の記録（dailyCounters/{日付}）とは重ならない', () => {
    expect(soldOutDocId('2026-10-30')).not.toBe('2026-10-30')
  })
})
