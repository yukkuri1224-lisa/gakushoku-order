import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MENU, MENU_CATEGORIES } from './menu'

// テストはプロジェクトのルートで動く
const publicDir = join(process.cwd(), 'public')

describe('メニューのデータ', () => {
  it('ジャンルは 定食・麺類・カレー・軽食 の順で、どれにも商品がある', () => {
    expect(MENU_CATEGORIES).toEqual(['定食', '麺類', 'カレー', '軽食'])
    for (const cat of MENU_CATEGORIES) {
      expect(MENU.some((m) => m.category === cat)).toBe(true)
    }
  })

  it('すべての商品がどれかのジャンルに入っていて、id が重ならない', () => {
    for (const m of MENU) expect(MENU_CATEGORIES).toContain(m.category)
    expect(new Set(MENU.map((m) => m.id)).size).toBe(MENU.length)
  })

  it('掲示のメニューがそろっている（23 品）', () => {
    expect(MENU).toHaveLength(23)
  })

  it('初期値の選択肢は、そのグループの選択肢の中にある', () => {
    for (const m of MENU) {
      for (const g of m.optionGroups ?? []) {
        if (g.defaultChoiceId === undefined) continue
        expect(g.choices.map((c) => c.id)).toContain(g.defaultChoiceId)
      }
    }
  })

  it('大盛りは掲示どおり +150 円（例：ランチA 510 → 660、唐揚カレー 580 → 730）', () => {
    const large = (id: string) => {
      const m = MENU.find((x) => x.id === id)!
      const size = m.optionGroups!.find((g) => g.id === 'size')!
      return m.price + size.choices.find((c) => c.id === 'large')!.priceDelta
    }
    expect(large('lunch_a')).toBe(660)
    expect(large('kake')).toBe(490)
    expect(large('karaage_curry')).toBe(730)
  })

  it('うどん・そばの商品は、毎回「うどん／そば」を選ぶ（初期値なし）', () => {
    const noodles = MENU.filter((m) => m.name.endsWith('うどん・そば'))
    expect(noodles).toHaveLength(5)
    for (const m of noodles) {
      const g = m.optionGroups?.find((x) => x.id === 'noodle')
      expect(g?.defaultChoiceId).toBeUndefined()
      expect(g?.choices.map((c) => c.label)).toEqual(['うどん', 'そば'])
    }
  })

  it('カレーにはすべて福神漬けの選択肢がある', () => {
    for (const m of MENU.filter((x) => x.category === 'カレー')) {
      expect(m.optionGroups?.map((g) => g.id)).toContain('fukujinzuke')
    }
  })

  it('画像のある商品は、public に画像ファイルがある', () => {
    for (const m of MENU) {
      if (m.image) expect(existsSync(`${publicDir}${m.image}`)).toBe(true)
    }
  })
})
