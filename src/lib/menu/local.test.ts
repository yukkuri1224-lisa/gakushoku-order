import { beforeEach, describe, expect, it } from 'vitest'
import { MENU } from '@/data/menu'
import { toStored } from './convert'
import { LocalMenuRepository } from './local'

beforeEach(() => localStorage.clear())

describe('メニューのローカル保存（Firebase 未設定時）', () => {
  it('まだ保存していなければ null（いまのメニューを使う）', () => {
    const got: unknown[] = []
    new LocalMenuRepository().subscribe((items) => got.push(items))
    expect(got).toEqual([null])
  })

  it('まとめて保存・1 品保存・削除が、並び順どおりに届く', async () => {
    const repo = new LocalMenuRepository()
    let latest: string[] | null = null
    repo.subscribe((entries) => (latest = entries && entries.map((e) => e.item.id)))
    await repo.saveAll(MENU.slice(0, 3).map((m, i) => ({ id: m.id, data: toStored(m, i) })))
    expect(latest).toEqual(['lunch_a', 'lunch_b', 'lunch_c'])

    await repo.save('new_item', { name: '親子丼', price: 450, category: '定食', sortOrder: 1.5 })
    expect(latest).toEqual(['lunch_a', 'lunch_b', 'new_item', 'lunch_c'])

    await repo.remove('lunch_b')
    expect(latest).toEqual(['lunch_a', 'new_item', 'lunch_c'])
  })
})
