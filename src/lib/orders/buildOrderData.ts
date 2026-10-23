// 注文ドキュメントの中身を作る（Firestore / ローカル同期で共通）。
// Firestore は undefined の項目を拒否するため、無い項目はキーごと省く。
import type { Order, OrderDraft, PaymentMethod } from '@/types/order'

export function buildOrderData(
  draft: OrderDraft,
  paymentMethod: PaymentMethod,
  orderNumber: number,
  now: number,
): Omit<Order, 'id'> {
  return {
    orderNumber,
    items: draft.items,
    total: draft.total,
    status: 'paid',
    paymentMethod,
    createdAt: now,
    ...(draft.diningOption ? { diningOption: draft.diningOption } : {}),
  }
}
