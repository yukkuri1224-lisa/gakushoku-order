// 支払い済みの注文を登録する（注文確認画面と、PayPay の支払い中の見張りで共通）。
// orderId を注文IDにするので、どの画面から何度呼んでも注文は1件だけ。
// PayPay のときは、支払い前に預けた中身を優先して使う（スマホで別のブラウザに戻ってきても注文を作れる）。
import { getOrderRepository } from '@/lib/orders'
import { clearPendingPayPayId } from '@/lib/payment'
import { rememberOrder } from '@/lib/myOrders'
import { cartTotal, useCartStore } from '@/store/cart'
import { useDiningStore } from '@/store/dining'
import type { OrderDraft, PaymentMethod } from '@/types/order'

/** 登録した注文のIDを返す。中身が見つからない（登録済みのあとに戻ってきた等）ときは null */
export async function registerPaidOrder(
  orderId: string,
  method: PaymentMethod,
): Promise<string | null> {
  const repo = getOrderRepository()
  const pending =
    method === 'paypay' ? await repo.getPendingDraft(orderId).catch(() => null) : null
  const current = useCartStore.getState().items
  const draft: OrderDraft | null =
    pending ??
    (current.length > 0
      ? {
          items: current,
          total: cartTotal(current),
          diningOption: useDiningStore.getState().option ?? undefined,
        }
      : null)
  if (!draft) return null

  const { id } = await repo.createOrder(draft, method, orderId)
  rememberOrder(id, Date.now())
  if (method === 'paypay') {
    clearPendingPayPayId()
    void repo.deletePendingDraft(orderId).catch(() => {})
  }
  useCartStore.getState().clear()
  return id
}
