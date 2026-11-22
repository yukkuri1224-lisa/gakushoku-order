// 支払い済みの注文を登録する（注文確認画面と、PayPay の支払い中の見張りで共通）。
// orderId を注文IDにするので、どの画面から何度呼んでも注文は1件だけ。
// PayPay のときは、支払い前に預けた中身を優先して使う（スマホで別のブラウザに戻ってきても注文を作れる）。
import { getOrderRepository } from '@/lib/orders'
import { clearPendingPayPayId } from '@/lib/payment'
import { rememberOrder } from '@/lib/myOrders'
import { currentDraft } from '@/lib/orderDraft'
import { useCartStore } from '@/store/cart'
import { useOrderPrefs } from '@/store/orderPrefs'
import type { OrderDraft, PaymentMethod } from '@/types/order'

/** 登録した注文のIDを返す。中身が見つからない（登録済みのあとに戻ってきた等）ときは null */
export async function registerPaidOrder(
  orderId: string,
  method: PaymentMethod,
): Promise<string | null> {
  const repo = getOrderRepository()
  const pending =
    method === 'paypay' ? await repo.getPendingDraft(orderId).catch(() => null) : null
  const draft: OrderDraft | null = pending ?? currentDraft()
  if (!draft) return null

  const { id } = await repo.createOrder(draft, method, orderId)
  rememberOrder(id, Date.now())
  if (method === 'paypay') {
    clearPendingPayPayId()
    void repo.deletePendingDraft(orderId).catch(() => {})
  }
  useCartStore.getState().clear()
  // 受け取り時間の予約は注文ごと（注文する人は端末に覚えておく）
  useOrderPrefs.getState().setPickupAt(null)
  return id
}
