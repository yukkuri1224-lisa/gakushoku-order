// いまのメニュー（zustand）。食堂がメニュー管理で保存していれば Firestore の menuItems、
// まだなら、はじめから入っているメニュー（src/data/menu.ts の MENU）。
// 画面は useMenu()、画面の外（カートの価格の直しなど）は useMenuStore.getState().items で読む。
// 編集（saveMenuItem / deleteMenuItem / moveMenuItem）は厨房ボードの「メニュー」から呼ぶ。
// はじめての編集では、いまのメニューを丸ごと保存してから変える（以後は変えた商品だけ書く）。
import { create } from 'zustand'
import { MENU, type MenuItem } from '@/data/menu'
import { getMenuRepository, toStored } from '@/lib/menu'

interface MenuState {
  items: MenuItem[]
  /** 商品 id → 並び順 */
  sortOrders: Record<string, number>
  /** 食堂が保存したメニューを使っているか（false ならはじめから入っているメニュー） */
  custom: boolean
}

const builtIn = (): MenuState => ({
  items: MENU,
  sortOrders: Object.fromEntries(MENU.map((m, i) => [m.id, i])),
  custom: false,
})

export const useMenuStore = create<MenuState>()(builtIn)

let started = false

/** メニューの購読を始める（最初に 1 回だけ。以後は変更がすぐ届く） */
export function startMenuSync(): void {
  if (started) return
  started = true
  getMenuRepository().subscribe((entries) =>
    useMenuStore.setState(
      entries
        ? {
            items: entries.map((e) => e.item),
            sortOrders: Object.fromEntries(entries.map((e) => [e.item.id, e.sortOrder])),
            custom: true,
          }
        : builtIn(),
    ),
  )
}

/** いまのメニュー（表示しない商品も含む）。購読もここで始める */
export function useMenu(): MenuItem[] {
  startMenuSync()
  return useMenuStore((s) => s.items)
}

/** 学生に出す商品（「表示しない」にしたものを除く） */
export function visibleMenu(items: MenuItem[]): MenuItem[] {
  return items.filter((m) => !m.hidden)
}

/** はじめての編集なら、いまのメニューを丸ごと保存する（変えた分を changes で上書き） */
async function saveEntries(changes: { item: MenuItem; sortOrder: number }[]): Promise<void> {
  const { items, sortOrders, custom } = useMenuStore.getState()
  const repo = getMenuRepository()
  if (custom) {
    await repo.saveAll(changes.map((c) => ({ id: c.item.id, data: toStored(c.item, c.sortOrder) })))
    return
  }
  const changed = new Map(changes.map((c) => [c.item.id, c]))
  const all = items.map((m) => changed.get(m.id) ?? { item: m, sortOrder: sortOrders[m.id] })
  for (const c of changes) if (!items.some((m) => m.id === c.item.id)) all.push(c)
  await repo.saveAll(all.map((c) => ({ id: c.item.id, data: toStored(c.item, c.sortOrder) })))
}

/** 新しい商品の id（名前に関係なく重ならないもの） */
export function newMenuItemId(): string {
  return 'item_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

/** 1 品を保存（新しい商品は最後に並べる） */
export async function saveMenuItem(item: MenuItem): Promise<void> {
  const { sortOrders } = useMenuStore.getState()
  const sortOrder =
    sortOrders[item.id] ?? Math.max(-1, ...Object.values(sortOrders)) + 1
  await saveEntries([{ item, sortOrder }])
}

/** 1 品を削除 */
export async function deleteMenuItem(id: string): Promise<void> {
  const { custom } = useMenuStore.getState()
  if (!custom) await saveEntries([])
  await getMenuRepository().remove(id)
}

/** 同じジャンルの中で、1 つ前（-1）・1 つ後（+1）と入れ替える */
export async function moveMenuItem(id: string, dir: -1 | 1): Promise<void> {
  const { items, sortOrders } = useMenuStore.getState()
  const me = items.find((m) => m.id === id)
  if (!me) return
  const same = items.filter((m) => m.category === me.category)
  const other = same[same.indexOf(me) + dir]
  if (!other) return
  // 2 つの並び順を入れ替える（同じ値どうしなら、動かす方を少しずらす）
  const mine = sortOrders[me.id]
  const theirs = sortOrders[other.id]
  await saveEntries([
    { item: me, sortOrder: mine === theirs ? theirs + dir * 0.5 : theirs },
    { item: other, sortOrder: mine },
  ])
}
