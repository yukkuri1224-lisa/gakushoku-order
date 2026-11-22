// メニューの保存形式（Firestore の menuItems / ローカル保存で共通）と、画面の MenuItem の変換。
// 選択肢は決まった名前（OPTION_PRESETS の id）だけを保存し、読み戻すときに中身を付ける。
import { MENU_CATEGORIES, OPTION_PRESETS, type MenuItem } from '@/data/menu'
import { normalizeForSearch } from '@/lib/menuSearch'

export interface StoredMenuItem {
  name: string
  price: number
  category: string
  /** 並び順（小さいほど先） */
  sortOrder: number
  yomi?: string
  description?: string
  image?: string
  badge?: string
  unit?: string
  options?: string[]
  hidden?: boolean
}

/** 画面の MenuItem → 保存形式（undefined の項目は持たない。Firestore が拒否するため） */
export function toStored(item: MenuItem, sortOrder: number): StoredMenuItem {
  const options = (item.optionGroups ?? []).map((g) => g.id)
  return {
    name: item.name,
    price: item.price,
    category: item.category,
    sortOrder,
    ...(item.yomi ? { yomi: item.yomi } : {}),
    ...(item.description ? { description: item.description } : {}),
    ...(item.image ? { image: item.image } : {}),
    ...(item.badge ? { badge: item.badge } : {}),
    ...(item.unit ? { unit: item.unit } : {}),
    ...(options.length > 0 ? { options } : {}),
    ...(item.hidden ? { hidden: true } : {}),
  }
}

/** 保存形式 → 画面の MenuItem（知らない選択肢は無視し、決まった順に並べる） */
export function fromStored(id: string, d: StoredMenuItem): MenuItem {
  const groups = OPTION_PRESETS.filter((g) => d.options?.includes(g.id))
  return {
    id,
    name: d.name,
    ...(d.yomi ? { yomi: d.yomi } : {}),
    price: d.price,
    category: d.category,
    ...(d.description ? { description: d.description } : {}),
    ...(d.image ? { image: d.image } : {}),
    ...(d.badge ? { badge: d.badge } : {}),
    ...(d.unit ? { unit: d.unit } : {}),
    ...(groups.length > 0 ? { optionGroups: groups } : {}),
    ...(d.hidden ? { hidden: true } : {}),
  }
}

export interface MenuInput {
  name: string
  price: string
  category: string
}

export type MenuInputErrors = Partial<Record<keyof MenuInput, string>>

export const MAX_NAME_LENGTH = 30
export const MAX_PRICE = 10000

/** メニュー管理の入力チェック（問題のある項目に理由を返す。問題がなければ {}） */
export function validateMenuInput(input: MenuInput): MenuInputErrors {
  const errors: MenuInputErrors = {}
  const name = input.name.trim()
  if (!name) errors.name = '名前を入れてください'
  else if (name.length > MAX_NAME_LENGTH) errors.name = `名前は${MAX_NAME_LENGTH}文字までです`
  const price = input.price.trim()
  if (!/^\d+$/.test(price)) errors.price = '値段は 0 以上の整数（円）で入れてください'
  else if (Number(price) > MAX_PRICE) errors.price = `値段は ${MAX_PRICE.toLocaleString()} 円までです`
  if (!MENU_CATEGORIES.includes(input.category)) errors.category = 'ジャンルを選んでください'
  return errors
}

/** 読みが空のときの代わり: 名前のひらがな・カタカナの部分（漢字は読めないので省く） */
export function yomiFromName(name: string): string {
  return normalizeForSearch(name).replace(/[^ぁ-ゖー・]/g, '')
}
