import { describe, expect, it } from 'vitest'
import { MENU } from '@/data/menu'
import {
  buildOrderItem,
  changedOptions,
  defaultSelection,
  itemKey,
  optionSummary,
  priceLabel,
  unitPrice,
} from './menuOptions'
import type { MenuItem } from '@/data/menu'

const ramen = MENU.find((m) => m.id === 'ramen')!
const curry = MENU.find((m) => m.id === 'curry')!

describe('defaultSelection', () => {
  it('カレーは 普通・福神漬けつける が初期値', () => {
    expect(defaultSelection(curry)).toEqual({
      size: 'regular',
      fukujinzuke: 'with',
    })
  })
})

describe('unitPrice', () => {
  it('大盛りは基本価格に +150 円', () => {
    expect(unitPrice(curry, { size: 'large', fukujinzuke: 'without' })).toBe(
      630,
    )
  })

  it('ラーメン普通は 430 円', () => {
    expect(unitPrice(ramen, defaultSelection(ramen))).toBe(430)
  })
})

describe('buildOrderItem', () => {
  it('選択肢込みの単価・数量・行の識別子を持つ', () => {
    const line = buildOrderItem(
      curry,
      { size: 'large', fukujinzuke: 'without' },
      2,
    )
    expect(line.price).toBe(630)
    expect(line.quantity).toBe(2)
    expect(line.key).toBe('curry|size:large|fukujinzuke:without')
    expect(line.menuItemId).toBe('curry')
    expect(line.name).toBe('カレーライス')
    expect(line.options?.map((o) => o.isDefault)).toEqual([false, false])
  })
})

describe('changedOptions', () => {
  it('初期値のままなら何も返さない', () => {
    expect(changedOptions(buildOrderItem(ramen, defaultSelection(ramen), 1))).toEqual(
      [],
    )
  })

  it('初期値から変えたものだけ返す', () => {
    const line = buildOrderItem(curry, { size: 'regular', fukujinzuke: 'without' }, 1)
    expect(changedOptions(line).map((o) => o.choiceLabel)).toEqual(['つけない'])
  })
})

describe('旧データ（選択肢なしの注文）', () => {
  const legacy = { name: 'ラーメン', price: 430, quantity: 1 }

  it('changedOptions は空', () => {
    expect(changedOptions(legacy)).toEqual([])
  })

  it('itemKey は商品名', () => {
    expect(itemKey(legacy)).toBe('ラーメン')
  })

  it('optionSummary は空文字', () => {
    expect(optionSummary(legacy)).toBe('')
  })
})

describe('optionSummary', () => {
  it('選んだ内容を「・」でつなぐ（福神漬けは「福神漬けあり／なし」と書く）', () => {
    const line = buildOrderItem(curry, { size: 'large', fukujinzuke: 'without' }, 1)
    expect(optionSummary(line)).toBe('大盛り・福神漬けなし')
    expect(optionSummary(buildOrderItem(curry, defaultSelection(curry), 1))).toBe(
      '普通・福神漬けあり',
    )
  })
})

describe('priceLabel', () => {
  it('有料の選択肢（大盛り）がある商品は「〜」を付ける', () => {
    expect(priceLabel(ramen)).toBe('¥430〜')
  })

  it('選択肢がない商品はそのままの価格', () => {
    const tea: MenuItem = { id: 'tea', name: 'お茶', price: 1200, category: 'ドリンク' }
    expect(priceLabel(tea)).toBe('¥1,200')
  })

  it('選択肢がすべて無料なら「〜」を付けない', () => {
    const rice: MenuItem = {
      id: 'rice',
      name: 'ごはん',
      price: 100,
      category: 'ご飯もの',
      optionGroups: [
        {
          id: 'g',
          label: 'のり',
          required: false,
          defaultChoiceId: 'a',
          choices: [
            { id: 'a', label: 'あり', priceDelta: 0 },
            { id: 'b', label: 'なし', priceDelta: 0 },
          ],
        },
      ],
    }
    expect(priceLabel(rice)).toBe('¥100')
  })
})
