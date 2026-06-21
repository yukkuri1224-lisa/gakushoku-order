// 決済プロバイダのファクトリ。VITE_PAYMENT_MODE で実装を切り替える。
//   mock   … MockPaymentProvider（デモ既定）
//   paypay … PayPayPaymentProvider（本番。未実装スタブ）
import { MockPaymentProvider } from './mock'
import { PayPayPaymentProvider } from './paypay'
import type { PaymentProvider } from './types'

export function getPaymentProvider(): PaymentProvider {
  const mode = import.meta.env.VITE_PAYMENT_MODE ?? 'mock'
  return mode === 'paypay'
    ? new PayPayPaymentProvider()
    : new MockPaymentProvider()
}

export type { PaymentProvider, PaymentResult } from './types'
