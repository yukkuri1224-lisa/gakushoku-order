import { beforeEach, describe, expect, it } from 'vitest'
import { rememberOrder, todaysOrderIds } from './myOrders'

const day = (d: number, h = 12, m = 0) => new Date(2026, 9, d, h, m).getTime()

beforeEach(() => {
  localStorage.clear()
})

describe('この端末でした注文の記録', () => {
  it('同じ注文IDを2回記録しても1件（登録のやり直しで重複しない）', () => {
    rememberOrder('mp-1', day(23, 12, 0))
    rememberOrder('mp-1', day(23, 12, 1))
    expect(todaysOrderIds(new Date(day(23, 13)))).toEqual(['mp-1'])
  })

  it('今日の注文だけを新しい順に返す（前日の注文は出さない）', () => {
    rememberOrder('yesterday', day(22, 12))
    rememberOrder('a', day(23, 11))
    rememberOrder('b', day(23, 12))
    expect(todaysOrderIds(new Date(day(23, 13)))).toEqual(['b', 'a'])
  })

  it('多くても5件まで', () => {
    for (let i = 0; i < 7; i++) rememberOrder(`o${i}`, day(23, 10, i))
    expect(todaysOrderIds(new Date(day(23, 13)))).toEqual(['o6', 'o5', 'o4', 'o3', 'o2'])
  })

  it('保存内容が壊れていても落ちない', () => {
    localStorage.setItem('gakushoku.myOrders', '{broken')
    expect(todaysOrderIds(new Date(day(23, 13)))).toEqual([])
  })
})
