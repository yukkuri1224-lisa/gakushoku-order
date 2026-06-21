// 決済プロバイダのファクトリ。VITE_PAYMENT_MODE で実装を切り替える。
//   mock   … MockPaymentProvider（デモ既定）
//   paypay … PayPayPaymentProvider（サンドボックス/本番。リダイレクト方式）
import { MockPaymentProvider } from './mock'
import { PayPayPaymentProvider } from './paypay'
import type { PaymentProvider } from './types'

export function getPaymentProvider(): PaymentProvider {
  const mode = import.meta.env.VITE_PAYMENT_MODE ?? 'mock'
  return mode === 'paypay'
    ? new PayPayPaymentProvider()
    : new MockPaymentProvider()
}

export const paymentMode: 'mock' | 'paypay' =
  import.meta.env.VITE_PAYMENT_MODE === 'paypay' ? 'paypay' : 'mock'

export {
  confirmPayPayPayment,
  getPendingPayPayId,
  clearPendingPayPayId,
} from './paypay'
export type { PaymentProvider, PaymentResult } from './types'
