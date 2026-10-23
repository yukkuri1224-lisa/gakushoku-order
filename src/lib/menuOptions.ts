// メニューの選択肢まわりの計算（副作用なし）。
// 商品シート・カート・注文番号画面・厨房ボードがここを共有する。
import type { MenuItem, OptionChoice, OptionGroup } from '@/data/menu'
import type { OrderItem, SelectedOption } from '@/types/order'

/** groupId -> choiceId */
export type Selection = Record<string, string>

/** 各グループの初期値を選んだ状態（初期値のないグループは未選択のまま） */
export function defaultSelection(item: MenuItem): Selection {
  const sel: Selection = {}
  for (const g of item.optionGroups ?? []) {
    if (g.defaultChoiceId !== undefined) sel[g.id] = g.defaultChoiceId
  }
  return sel
}

function chosen(g: OptionGroup, sel: Selection): OptionChoice | undefined {
  return (
    g.choices.find((c) => c.id === sel[g.id]) ??
    g.choices.find((c) => c.id === g.defaultChoiceId)
  )
}

/** まだ選ばれていないグループ（初期値がなく、お客さんが選んでいないもの） */
export function missingChoices(item: MenuItem, sel: Selection): OptionGroup[] {
  return (item.optionGroups ?? []).filter((g) => chosen(g, sel) === undefined)
}

// 未選択のグループは含めない（カートに入れる前に missingChoices で止める）
function selectedOptions(item: MenuItem, sel: Selection): SelectedOption[] {
  return (item.optionGroups ?? []).flatMap((g) => {
    const choice = chosen(g, sel)
    if (!choice) return []
    return [
      {
        groupId: g.id,
        groupLabel: g.label,
        choiceId: choice.id,
        choiceLabel: choice.label,
        summaryLabel: choice.summaryLabel ?? choice.label,
        priceDelta: choice.priceDelta,
        isDefault: choice.id === g.defaultChoiceId,
        // Firestore は undefined を拒否するため、毎回選ぶグループのときだけ項目を持たせる
        ...(g.defaultChoiceId === undefined ? { mustChoose: true } : {}),
      },
    ]
  })
}

/** 選択肢込みの単価 */
export function unitPrice(item: MenuItem, sel: Selection): number {
  return selectedOptions(item, sel).reduce(
    (sum, o) => sum + o.priceDelta,
    item.price,
  )
}

/** カートに入れる1行を作る。同じ商品・同じ選択肢なら key が一致する */
export function buildOrderItem(
  item: MenuItem,
  sel: Selection,
  quantity: number,
): OrderItem {
  const options = selectedOptions(item, sel)
  const key = [item.id, ...options.map((o) => `${o.groupId}:${o.choiceId}`)].join(
    '|',
  )
  return {
    key,
    menuItemId: item.id,
    name: item.name,
    price: unitPrice(item, sel),
    quantity,
    options,
  }
}

/** カートの行の識別子（旧データは商品名） */
export function itemKey(i: OrderItem): string {
  return i.key ?? i.name
}

/** 初期値から変えた選択肢だけ（厨房で強調表示する分） */
export function changedOptions(i: OrderItem): SelectedOption[] {
  return (i.options ?? []).filter((o) => !o.isDefault)
}

/** 選んだ内容を「大盛り・福神漬けなし」のように1行にする */
export function optionSummary(i: OrderItem): string {
  return (i.options ?? []).map((o) => o.summaryLabel ?? o.choiceLabel).join('・')
}

/** 一覧・商品シートの価格表示。有料の選択肢（大盛りなど）がある商品は「¥430〜」 */
export function priceLabel(item: MenuItem): string {
  const hasPaidOption = (item.optionGroups ?? []).some((g) =>
    g.choices.some((c) => c.priceDelta > 0),
  )
  return `¥${item.price.toLocaleString()}${hasPaidOption ? '〜' : ''}`
}
