import { beforeEach, describe, expect, it } from 'vitest'
import { MENU } from '@/data/menu'
import { buildOrderItem, defaultSelection } from '@/lib/menuOptions'
import { cartCount, cartTotal, useCartStore } from './cart'

const ramen = MENU.find((m) => m.id === 'ramen')!
const curry = MENU.find((m) => m.id === 'curry')!
const curryLarge = { size: 'large', fukujinzuke: 'with' }

beforeEach(() => {
  useCartStore.getState().clear()
})

describe('add', () => {
  it('同じ商品・同じ選択肢を2回追加すると1行で数量2', () => {
    const { add } = useCartStore.getState()
    add(buildOrderItem(curry, curryLarge, 1))
    add(buildOrderItem(curry, curryLarge, 1))
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(2)
  })

  it('選択肢が違えば別の行', () => {
    const { add } = useCartStore.getState()
    add(buildOrderItem(curry, curryLarge, 1))
    add(buildOrderItem(curry, defaultSelection(curry), 1))
    expect(useCartStore.getState().items).toHaveLength(2)
  })

  it('数量ごと加算する', () => {
    useCartStore.getState().add(buildOrderItem(ramen, defaultSelection(ramen), 3))
    expect(useCartStore.getState().items[0].quantity).toBe(3)
  })
})

describe('行の識別子で操作する', () => {
  it('increment / decrement / remove は key で対象を選ぶ', () => {
    const { add } = useCartStore.getState()
    const large = buildOrderItem(curry, curryLarge, 1)
    const regular = buildOrderItem(curry, defaultSelection(curry), 1)
    add(large)
    add(regular)

    useCartStore.getState().increment(large.key!)
    useCartStore.getState().decrement(regular.key!)

    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].key).toBe(large.key)
    expect(items[0].quantity).toBe(2)

    useCartStore.getState().remove(large.key!)
    expect(useCartStore.getState().items).toHaveLength(0)
  })
})

describe('旧バージョンのカート（key / options なし）', () => {
  it('商品名で数量変更・削除できる', () => {
    useCartStore.setState({
      items: [{ name: 'ラーメン', price: 430, quantity: 1 }],
    })
    useCartStore.getState().increment('ラーメン')
    expect(useCartStore.getState().items[0].quantity).toBe(2)
    useCartStore.getState().remove('ラーメン')
    expect(useCartStore.getState().items).toHaveLength(0)
  })
})

describe('cartTotal / cartCount', () => {
  it('単価×数量の合計と点数', () => {
    const items = [
      buildOrderItem(curry, { size: 'large', fukujinzuke: 'without' }, 1),
      buildOrderItem(ramen, defaultSelection(ramen), 2),
    ]
    expect(cartTotal(items)).toBe(1490)
    expect(cartCount(items)).toBe(3)
  })
})
