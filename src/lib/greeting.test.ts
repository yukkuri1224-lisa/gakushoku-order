import { describe, expect, it } from 'vitest'
import { greeting } from './greeting'

const at = (h: number, m: number) => new Date(2026, 9, 23, h, m)

describe('greeting', () => {
  it.each([
    [at(4, 59), 'こんばんは'],
    [at(5, 0), 'おはようございます'],
    [at(10, 59), 'おはようございます'],
    [at(11, 0), 'こんにちは'],
    [at(17, 59), 'こんにちは'],
    [at(18, 0), 'こんばんは'],
  ])('%s → %s', (d, expected) => {
    expect(greeting(d)).toBe(expected)
  })
})
