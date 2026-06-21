// ▼本番化の差し替えポイント（決済）:
//   PayPay Web Payment API を呼ぶ実装をここに書く。
//   PayPay は法人の加盟店契約と審査が必要で、デモ段階では利用できない。
//   実際の API 呼び出しはシークレットを扱うため、ブラウザから直接ではなく
//   Vercel Serverless Functions（/api）経由で行うこと。
//   実装後は .env の VITE_PAYMENT_MODE=paypay にするだけで getPaymentProvider() が
//   この実装に切り替わる。
import type { OrderDraft, PaymentProvider, PaymentResult } from './types'

export class PayPayPaymentProvider implements PaymentProvider {
  async pay(_amount: number, _orderDraft: OrderDraft): Promise<PaymentResult> {
    throw new Error('PayPayPaymentProvider は未実装です（本番化時に実装してください）')
  }
}
