import { describe, expect, it } from 'vitest'
import { MENU } from '@/data/menu'
import { buildOrderItem, defaultSelection, itemKey, priceLabel } from './menuOptions'
import { CONTAINER_FEE, TOP_CONTAINER_FEE, forDining, repriceLines } from './takeout'

const item = (id: string) => MENU.find((m) => m.id === id)!

describe('お持ち帰りの容器', () => {
  it('店内で食べるときは、価格も選択肢もそのまま', () => {
    const curry = item('curry')
    expect(forDining(curry, 'eat_in')).toBe(curry)
  })

  it('お持ち帰りでは、下の容器（20円）を価格に含め、上の容器（10円）を選べる（初期はつけない）', () => {
    expect(CONTAINER_FEE).toBe(20)
    expect(TOP_CONTAINER_FEE).toBe(10)
    const curry = forDining(item('curry'), 'takeout')
    expect(curry.price).toBe(500)
    expect(priceLabel(curry)).toBe('¥500〜')
    const top = curry.optionGroups!.find((g) => g.id === 'top_container')!
    expect(top.defaultChoiceId).toBe('none')
    expect(top.choices.find((c) => c.id === 'with')?.priceDelta).toBe(10)

    const plain = buildOrderItem(curry, defaultSelection(curry), 1)
    expect(plain.price).toBe(500)
    const withTop = buildOrderItem(curry, { ...defaultSelection(curry), top_container: 'with' }, 2)
    expect(withTop.price).toBe(510)
    expect(withTop.options?.find((o) => o.groupId === 'top_container')?.summaryLabel).toBe('上の容器あり')
  })

  it('夕定食のように選択肢のない料理も、お持ち帰りなら容器代込み', () => {
    expect(forDining(item('dinner_set'), 'takeout').price).toBe(510)
  })

  it('ホットスナックは容器を使わないので、お持ち帰りでも変わらない', () => {
    const takoyaki = item('takoyaki')
    expect(forDining(takoyaki, 'takeout')).toBe(takoyaki)
  })
})

describe('ご利用方法を変えたときのカート', () => {
  const curry = item('curry')
  const kake = item('kake')

  it('店内 → お持ち帰り: 容器代を足す（選んだ麺・サイズはそのまま）', () => {
    const lines = [
      buildOrderItem(kake, { noodle: 'soba', size: 'large', negi: 'without' }, 2),
      buildOrderItem(item('takoyaki'), {}, 1),
    ]
    const next = repriceLines(lines, 'takeout')
    expect(next[0].price).toBe(340 + 150 + 20)
    expect(next[0].quantity).toBe(2)
    expect(next[0].options?.map((o) => o.choiceId)).toEqual(['soba', 'large', 'without', 'none'])
    expect(next[1]).toEqual(lines[1])
  })

  it('お持ち帰り → 店内: 容器代と上の容器を外し、同じ中身になった行はまとめる', () => {
    const t = forDining(curry, 'takeout')
    const lines = [
      buildOrderItem(t, { ...defaultSelection(t), top_container: 'with' }, 1),
      buildOrderItem(t, defaultSelection(t), 2),
    ]
    const next = repriceLines(lines, 'eat_in')
    expect(next).toHaveLength(1)
    expect(next[0].price).toBe(480)
    expect(next[0].quantity).toBe(3)
    expect(itemKey(next[0])).toBe(itemKey(buildOrderItem(curry, defaultSelection(curry), 1)))
  })

  it('メニューにない古い行は、そのまま残す', () => {
    const old = { name: '昔のメニュー', price: 300, quantity: 1 }
    expect(repriceLines([old], 'takeout')).toEqual([old])
  })
})
