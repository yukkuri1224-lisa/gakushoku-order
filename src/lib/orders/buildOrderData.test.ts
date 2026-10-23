import { describe, expect, it } from 'vitest'
import { buildOrderData } from './buildOrderData'
import type { OrderDraft } from '@/types/order'

const items = [{ name: '醤油ラーメン', price: 430, quantity: 1 }]

describe('buildOrderData', () => {
  it('受付済みの注文データを作る', () => {
    const data = buildOrderData({ items, total: 430 }, 'paypay', 7, 1000)
    expect(data).toEqual({
      orderNumber: 7,
      items,
      total: 430,
      status: 'paid',
      paymentMethod: 'paypay',
      createdAt: 1000,
    })
  })

  it('利用方法が無いときは項目自体を持たない（Firestore は undefined を拒否する）', () => {
    const draft: OrderDraft = { items, total: 430, diningOption: undefined }
    const data = buildOrderData(draft, 'mock', 1, 0)
    expect('diningOption' in data).toBe(false)
  })

  it('利用方法があれば記録する', () => {
    const data = buildOrderData(
      { items, total: 430, diningOption: 'takeout' },
      'mock',
      1,
      0,
    )
    expect(data.diningOption).toBe('takeout')
  })
})
