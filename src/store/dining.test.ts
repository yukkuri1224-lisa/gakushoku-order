import { beforeEach, describe, expect, it } from 'vitest'
import { MENU } from '@/data/menu'
import { buildOrderItem, defaultSelection } from '@/lib/menuOptions'
import { useCartStore } from './cart'
import { useDiningStore } from './dining'

beforeEach(() => {
  localStorage.clear()
  useDiningStore.setState({ option: null })
  useCartStore.setState({ items: [] })
})

describe('useDiningStore', () => {
  it('最初は未選択', () => {
    expect(useDiningStore.getState().option).toBeNull()
  })

  it('選んだ利用方法を localStorage に残す（PayPay から別タブで戻っても消えない）', () => {
    useDiningStore.getState().setOption('takeout')
    expect(useDiningStore.getState().option).toBe('takeout')
    expect(localStorage.getItem('gakushoku.dining')).toContain('takeout')
  })
})

describe('ご利用方法を変えたとき', () => {
  const curry = MENU.find((m) => m.id === 'curry')!

  it('カートの料理を、お持ち帰りの容器代込みの価格に直す（戻すと元の価格）', () => {
    useDiningStore.getState().setOption('eat_in')
    useCartStore.getState().add(buildOrderItem(curry, defaultSelection(curry), 2))
    useDiningStore.getState().setOption('takeout')
    expect(useCartStore.getState().items[0].price).toBe(500)
    useDiningStore.getState().setOption('eat_in')
    expect(useCartStore.getState().items[0].price).toBe(480)
    expect(useCartStore.getState().items[0].quantity).toBe(2)
  })
})
