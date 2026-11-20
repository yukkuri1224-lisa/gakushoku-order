// お持ち帰りの容器（副作用なし）。
//   - 下の容器（20円）は必ず付くので、お持ち帰りのときはメニューの価格に含めて出す。
//   - 上の容器（10円）は、料理ごとに選べる（初期はつけない）。
//   - ホットスナックは容器を使わないので、お持ち帰りでも変わらない。
// 商品シート・一覧・カートは、forDining() で「いまのご利用方法での商品」にしてから計算する。
import { MENU, isHotSnack, type MenuItem, type OptionGroup } from '@/data/menu'
import { buildOrderItem, itemKey, type Selection } from '@/lib/menuOptions'
import type { DiningOption, OrderItem } from '@/types/order'

export const CONTAINER_FEE = 20
export const TOP_CONTAINER_FEE = 10

const TOP_CONTAINER: OptionGroup = {
  id: 'top_container',
  label: '上の容器',
  required: false,
  defaultChoiceId: 'none',
  choices: [
    { id: 'none', label: 'つけない', priceDelta: 0, summaryLabel: '上の容器なし' },
    { id: 'with', label: 'つける', priceDelta: TOP_CONTAINER_FEE, summaryLabel: '上の容器あり' },
  ],
}

/** そのご利用方法での商品（お持ち帰りなら容器代込みの価格と、上の容器の選択肢） */
export function forDining(item: MenuItem, dining: DiningOption | null): MenuItem {
  if (dining !== 'takeout' || isHotSnack(item)) return item
  return {
    ...item,
    price: item.price + CONTAINER_FEE,
    optionGroups: [...(item.optionGroups ?? []), TOP_CONTAINER],
  }
}

/** お持ち帰りで、容器代を含めた価格になっている商品か */
export function includesContainer(item: MenuItem, dining: DiningOption | null): boolean {
  return forDining(item, dining) !== item
}

/**
 * ご利用方法を変えたときに、カートの行を作り直す（選んだ麺・サイズなどはそのまま）。
 * 容器代を足し引きし、同じ中身になった行はまとめる。メニューにない古い行はそのまま。
 */
export function repriceLines(lines: OrderItem[], dining: DiningOption | null): OrderItem[] {
  const out: OrderItem[] = []
  for (const line of lines) {
    const base = line.menuItemId ? MENU.find((m) => m.id === line.menuItemId) : undefined
    if (!base) {
      out.push(line)
      continue
    }
    const sel: Selection = {}
    for (const o of line.options ?? []) sel[o.groupId] = o.choiceId
    const item = forDining(base, dining)
    // 店内に変えたら上の容器は外す（その選択肢がない商品の選択は捨てる）
    for (const id of Object.keys(sel)) {
      if (!(item.optionGroups ?? []).some((g) => g.id === id)) delete sel[id]
    }
    const next = buildOrderItem(item, sel, line.quantity)
    const same = out.find((o) => itemKey(o) === itemKey(next))
    if (same) same.quantity += next.quantity
    else out.push(next)
  }
  return out
}
