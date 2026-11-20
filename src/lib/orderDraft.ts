// いまの画面の選択（カート・ご利用方法・受け取り時間・注文する人）から、注文の中身を作る。
// 支払いの前（PayPay に預ける中身）と、支払い後に注文を登録するときで共通。
import { cartTotal, useCartStore } from '@/store/cart'
import { useDiningStore } from '@/store/dining'
import { useOrderPrefs } from '@/store/orderPrefs'
import type { OrderDraft } from '@/types/order'

/** カートが空なら null */
export function currentDraft(): OrderDraft | null {
  const items = useCartStore.getState().items
  if (items.length === 0) return null
  const dining = useDiningStore.getState().option
  const { pickupAt, orderer } = useOrderPrefs.getState()
  return {
    items,
    total: cartTotal(items),
    ...(dining ? { diningOption: dining } : {}),
    ...(pickupAt ? { pickupAt } : {}),
    ...(orderer === 'teacher' ? { orderer: 'teacher' as const } : {}),
  }
}
