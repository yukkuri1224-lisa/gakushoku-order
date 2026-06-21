// 決済プロバイダの抽象。デモ=Mock / 本番=PayPay を差し替え可能にする。
import type { OrderDraft, PaymentMethod } from '@/types/order'

export interface PaymentResult {
  success: boolean
  paymentMethod: PaymentMethod
}

export interface PaymentProvider {
  pay(amount: number, orderDraft: OrderDraft): Promise<PaymentResult>
}

export type { OrderDraft }
