import { describe, expect, it } from 'vitest'
import { MENU } from '@/data/menu'
import { fromStored, toStored, validateMenuInput, yomiFromName } from './convert'

describe('メニューの保存形式', () => {
  it('いまのメニュー 23 品は、保存して読み戻しても同じ（選択肢・画像・読み・単位・ラベルも）', () => {
    MENU.forEach((m, i) => {
      const stored = toStored(m, i)
      expect(stored.sortOrder).toBe(i)
      expect(JSON.parse(JSON.stringify(stored))).toEqual(stored) // undefined を含まない（Firestore は拒否する）
      expect(fromStored(m.id, stored)).toEqual(m)
    })
  })

  it('選択肢は名前（size・noodle・negi・fukujinzuke）だけ保存し、読み戻すと決まった順に並ぶ', () => {
    const kake = MENU.find((m) => m.id === 'kake')!
    expect(toStored(kake, 0).options).toEqual(['noodle', 'size', 'negi'])
    const back = fromStored('x', { name: 'x', price: 100, category: '麺類', sortOrder: 0, options: ['negi', 'size', 'unknown'] })
    expect(back.optionGroups?.map((g) => g.id)).toEqual(['size', 'negi'])
  })

  it('非表示の印を保つ', () => {
    const back = fromStored('x', { name: 'x', price: 100, category: '定食', sortOrder: 0, hidden: true })
    expect(back.hidden).toBe(true)
  })
})

describe('メニューの入力チェック', () => {
  const ok = { name: '親子丼', price: '450', category: '定食' }

  it('名前・値段・ジャンルがそろっていれば OK', () => {
    expect(validateMenuInput(ok)).toEqual({})
  })

  it('名前が空・長すぎる、値段が数字でない・負・大きすぎる、ジャンルがないときは理由を返す', () => {
    expect(validateMenuInput({ ...ok, name: ' ' }).name).toBeDefined()
    expect(validateMenuInput({ ...ok, name: 'あ'.repeat(31) }).name).toBeDefined()
    expect(validateMenuInput({ ...ok, price: 'abc' }).price).toBeDefined()
    expect(validateMenuInput({ ...ok, price: '-10' }).price).toBeDefined()
    expect(validateMenuInput({ ...ok, price: '12.5' }).price).toBeDefined()
    expect(validateMenuInput({ ...ok, price: '20000' }).price).toBeDefined()
    expect(validateMenuInput({ ...ok, category: '' }).category).toBeDefined()
  })

  it('読みが空なら、名前のカタカナ・ひらがなから作る（漢字はそのまま検索に使われない）', () => {
    expect(yomiFromName('チキンカレー')).toBe('ちきんかれー')
    expect(yomiFromName('とんかつ定食')).toBe('とんかつ')
  })
})
