import { beforeEach, describe, expect, it } from 'vitest'
import { LocalOrderRepository } from './local'
import type { Order, OrderDraft } from '@/types/order'

const draft: OrderDraft = {
  items: [{ name: '醤油ラーメン', price: 430, quantity: 1 }],
  total: 430,
}

function activeCount(repo: LocalOrderRepository): number {
  let n = -1
  const unsub = repo.subscribeActiveOrders((list: Order[]) => {
    n = list.length
  })
  unsub()
  return n
}

beforeEach(() => {
  localStorage.clear()
})

describe('LocalOrderRepository.createOrder', () => {
  it('同じ注文IDで2回呼んでも注文は1件で、同じ番号を返す', async () => {
    const repo = new LocalOrderRepository()
    const first = await repo.createOrder(draft, 'paypay', 'mp-1')
    const second = await repo.createOrder(draft, 'paypay', 'mp-1')
    expect(first).toEqual({ id: 'mp-1', orderNumber: 1 })
    expect(second).toEqual({ id: 'mp-1', orderNumber: 1 })
    expect(activeCount(repo)).toBe(1)
  })

  it('注文IDなしなら毎回新しい注文として採番する', async () => {
    const repo = new LocalOrderRepository()
    const a = await repo.createOrder(draft, 'mock')
    const b = await repo.createOrder(draft, 'mock')
    expect(a.orderNumber).toBe(1)
    expect(b.orderNumber).toBe(2)
    expect(a.id).not.toBe(b.id)
  })
})

describe('支払い前に預ける注文の中身（PayPay から別のブラウザに戻ったとき用）', () => {
  it('預けた中身を、支払いIDで取り出せる。消したら取り出せない', async () => {
    const repo = new LocalOrderRepository()
    await repo.savePendingDraft('mp-9', { ...draft, diningOption: 'takeout' })
    expect(await repo.getPendingDraft('mp-9')).toEqual({ ...draft, diningOption: 'takeout' })
    await repo.deletePendingDraft('mp-9')
    expect(await repo.getPendingDraft('mp-9')).toBeNull()
  })

  it('預けていない支払いIDは null', async () => {
    expect(await new LocalOrderRepository().getPendingDraft('nothing')).toBeNull()
  })
})

