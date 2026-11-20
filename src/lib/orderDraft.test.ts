import { beforeEach, describe, expect, it } from 'vitest'
import { MENU } from '@/data/menu'
import { buildOrderItem, defaultSelection } from '@/lib/menuOptions'
import { buildOrderData } from '@/lib/orders/buildOrderData'
import { useCartStore } from '@/store/cart'
import { useDiningStore } from '@/store/dining'
import { useOrderPrefs } from '@/store/orderPrefs'
import { currentDraft } from './orderDraft'

const curry = MENU.find((m) => m.id === 'curry')!

beforeEach(() => {
  localStorage.clear()
  useCartStore.setState({ items: [buildOrderItem(curry, defaultSelection(curry), 1)] })
  useDiningStore.setState({ option: 'eat_in' })
  useOrderPrefs.setState({ pickupAt: null, orderer: 'student' })
})

describe('注文の中身', () => {
  it('生徒・できしだいなら、予約と注文者の項目は入れない', () => {
    const draft = currentDraft()!
    expect(draft).toEqual({ items: useCartStore.getState().items, total: 480, diningOption: 'eat_in' })
    const data = buildOrderData(draft, 'mock', 1, 0)
    expect('pickupAt' in data).toBe(false)
    expect('orderer' in data).toBe(false)
  })

  it('予約の時間と、先生の注文であることを入れる', () => {
    useOrderPrefs.setState({ pickupAt: 1_790_000_000_000, orderer: 'teacher' })
    const draft = currentDraft()!
    expect(draft.pickupAt).toBe(1_790_000_000_000)
    expect(draft.orderer).toBe('teacher')
    const data = buildOrderData(draft, 'mock', 1, 0)
    expect(data.pickupAt).toBe(1_790_000_000_000)
    expect(data.orderer).toBe('teacher')
  })

  it('カートが空なら中身はない', () => {
    useCartStore.setState({ items: [] })
    expect(currentDraft()).toBeNull()
  })
})
