import { beforeEach, describe, expect, it } from 'vitest'
import { MENU } from '@/data/menu'
import { deleteMenuItem, moveMenuItem, saveMenuItem, startMenuSync, useMenuStore, visibleMenu } from './menu'

beforeEach(() => useMenuStore.setState({ items: MENU, custom: false }))


describe('いまのメニュー', () => {
  it('食堂がまだ編集していなければ、はじめから入っているメニュー', () => {
    expect(useMenuStore.getState().items).toBe(MENU)
    expect(useMenuStore.getState().custom).toBe(false)
  })

  it('学生に出すのは、非表示にしていないものだけ', () => {
    useMenuStore.setState({ items: [MENU[0], { ...MENU[1], hidden: true }], custom: true })
    expect(visibleMenu(useMenuStore.getState().items).map((m) => m.id)).toEqual([MENU[0].id])
  })
})

describe('メニューの編集', () => {
  beforeEach(() => {
    localStorage.clear()
    startMenuSync()
    useMenuStore.setState({
      items: MENU,
      sortOrders: Object.fromEntries(MENU.map((m, i) => [m.id, i])),
      custom: false,
    })
  })

  const ids = () => useMenuStore.getState().items.map((m) => m.id)

  it('はじめての保存で、いまのメニューを丸ごと移し、変えた商品だけ新しい中身になる', async () => {
    const curry = MENU.find((m) => m.id === 'curry')!
    await saveMenuItem({ ...curry, price: 500 })
    const s = useMenuStore.getState()
    expect(s.custom).toBe(true)
    expect(s.items).toHaveLength(MENU.length)
    expect(s.items.find((m) => m.id === 'curry')?.price).toBe(500)
    expect(ids()).toEqual(MENU.map((m) => m.id))
  })

  it('新しい商品は最後に並ぶ', async () => {
    await saveMenuItem({ id: 'oyakodon', name: '親子丼', price: 450, category: '定食' })
    expect(ids().at(-1)).toBe('oyakodon')
    expect(useMenuStore.getState().items).toHaveLength(MENU.length + 1)
  })

  it('同じジャンルの中で順番を入れ替えられる（端ではそのまま）', async () => {
    await moveMenuItem('lunch_a', 1)
    expect(ids().slice(0, 3)).toEqual(['lunch_b', 'lunch_a', 'lunch_c'])
    await moveMenuItem('lunch_b', -1)
    expect(ids().slice(0, 3)).toEqual(['lunch_b', 'lunch_a', 'lunch_c'])
  })

  it('削除できる', async () => {
    await deleteMenuItem('fries')
    expect(ids()).not.toContain('fries')
    expect(useMenuStore.getState().items).toHaveLength(MENU.length - 1)
  })
})
