// デモ用モック決済。PayPay 風の確認モーダルを表示し、ユーザーが「支払う」を
// 押したら success:true を返すだけ。実際の決済は行わない。
// モーダルUIは React 側（PaymentModalHost）に置き、ここでは usePaymentUiStore 経由で
// 承認を待つ（lib を React に直接依存させないための疎結合）。
import { usePaymentUiStore } from '@/store/paymentUi'
import type { OrderDraft, PaymentProvider, PaymentResult } from './types'

export class MockPaymentProvider implements PaymentProvider {
  async pay(amount: number, _orderDraft: OrderDraft): Promise<PaymentResult> {
    const approved = await usePaymentUiStore.getState().requestApproval(amount)
    return { success: approved, paymentMethod: 'mock' }
  }
}
