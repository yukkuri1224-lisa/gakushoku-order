import { describe, expect, it } from 'vitest'
import { MENU } from '@/data/menu'
import { searchMenu } from './menuSearch'

const ids = (q: string) => searchMenu(MENU, q).map((m) => m.id)

describe('メニュー検索', () => {
  it('ひらがなで、漢字やカタカナの料理も見つかる', () => {
    expect(ids('からあげ')).toEqual(['karaage_curry', 'karaage'])
    expect(ids('かれー')).toEqual(['curry_noodle', 'curry', 'katsu_curry', 'karaage_curry'])
  })

  it('カタカナ・半角カナ・全角英字でも同じように見つかる', () => {
    expect(ids('カレー')).toEqual(ids('かれー'))
    expect(ids('ﾗｰﾒﾝ')).toEqual(['ramen', 'wonton_ramen'])
    expect(ids('ランチＡ')).toEqual(['lunch_a'])
  })

  it('うどん・ポテトのように、名前の一部でも見つかる', () => {
    expect(ids('うどん')).toHaveLength(5)
    expect(ids('ぽてと')).toEqual(['hash_potato', 'fries'])
  })

  it('空・空白だけなら何も返さない。見つからなければ空', () => {
    expect(ids('')).toEqual([])
    expect(ids('  ')).toEqual([])
    expect(ids('ぴざ')).toEqual([])
  })
})
