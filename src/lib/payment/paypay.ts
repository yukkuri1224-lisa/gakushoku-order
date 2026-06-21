// PayPay 決済プロバイダ（サンドボックス対応・リダイレクト方式）。
//   pay() がサーバー関数 /api/paypay/create を呼んで決済URLを取得し、PayPay の
//   決済ページへリダイレクトする。支払い後は redirectUrl（/checkout?pp=return&mpid=...）
//   に戻り、CheckoutPage が confirmPayPayPayment() で支払いを確認してから注文を作成する。
//
// 秘密鍵はサーバー側（/api）でのみ扱い、ここ（ブラウザ）からは呼ばない。
// 有効化するには環境変数 VITE_PAYMENT_MODE=paypay にする（getPaymentProvider が切替）。
// ※/api は Vercel 上（または vercel dev）でのみ動作。ローカルの npm run dev では mock を使うこと。
import type { OrderDraft, PaymentProvider, PaymentResult } from './types'

const MPID_KEY = 'paypay.mpid'

export class PayPayPaymentProvider implements PaymentProvider {
  async pay(amount: number, _orderDraft: OrderDraft): Promise<PaymentResult> {
    const res = await fetch('/api/paypay/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? 'PayPay 決済の開始に失敗しました')
    }
    const { url, merchantPaymentId } = (await res.json()) as {
      url: string
      merchantPaymentId: string
    }
    // 戻ってきた時に支払い確認できるよう保持
    sessionStorage.setItem(MPID_KEY, merchantPaymentId)
    // PayPay の決済ページへリダイレクト（このあとページは遷移するので解決しない）
    window.location.href = url
    return new Promise<PaymentResult>(() => {})
  }
}

/** 決済ページから戻った後、支払いが完了したかをサーバー経由で確認する。 */
export async function confirmPayPayPayment(
  merchantPaymentId: string,
): Promise<boolean> {
  const res = await fetch(
    `/api/paypay/status?merchantPaymentId=${encodeURIComponent(merchantPaymentId)}`,
  )
  if (!res.ok) return false
  const { status } = (await res.json()) as { status?: string }
  return status === 'COMPLETED'
}

/** リダイレクト前に保存した merchantPaymentId を取得 */
export function getPendingPayPayId(): string | null {
  return sessionStorage.getItem(MPID_KEY)
}

/** 確認後に保存済みの merchantPaymentId を破棄 */
export function clearPendingPayPayId(): void {
  sessionStorage.removeItem(MPID_KEY)
}
