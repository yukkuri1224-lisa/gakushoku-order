// PayPay 決済プロバイダ（サンドボックス対応・リダイレクト方式）。
//   pay() がサーバー関数 /api/paypay/create を呼んで決済URLを取得し、PayPay の
//   決済ページへリダイレクトする。支払い後は redirectUrl（/checkout?pp=return&mpid=...）
//   に戻り、CheckoutPage が confirmPayPayPayment() で支払いを確認してから注文を作成する。
//   スマホでは PayPay アプリから「ふだんのブラウザ」に戻ることがあるため、移る前に注文の中身を
//   Firestore に預けておく（戻った先のカートが空でも注文を作れる）。
//
// 秘密鍵はサーバー側（/api）でのみ扱い、ここ（ブラウザ）からは呼ばない。
// 有効化するには環境変数 VITE_PAYMENT_MODE=paypay にする（getPaymentProvider が切替）。
// ※/api は Vercel 上（または vercel dev）でのみ動作。ローカルの npm run dev では mock を使うこと。
import { getOrderRepository } from '@/lib/orders'
import type { OrderDraft, PaymentProvider, PaymentResult } from './types'

// 支払い中の merchantPaymentId。ホーム画面のアプリが閉じられても残るよう localStorage に置く。
// 支払いをやめた記録が残り続けないよう、3 時間たったものは捨てる。
const MPID_KEY = 'paypay.mpid'
const MPID_TTL_MS = 3 * 60 * 60 * 1000

export class PayPayPaymentProvider implements PaymentProvider {
  async pay(amount: number, orderDraft: OrderDraft): Promise<PaymentResult> {
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
    rememberPendingPayPayId(merchantPaymentId)
    // 注文の中身を預ける（PayPay アプリから別のブラウザに戻っても注文を作れるように）。
    // 預けられなくても、同じブラウザに戻ればカートから作れるので先へ進む。
    await getOrderRepository()
      .savePendingDraft(merchantPaymentId, orderDraft)
      .catch((e) => console.warn('注文の中身を預けられませんでした', e))
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

/** 支払い中の merchantPaymentId を記録する */
export function rememberPendingPayPayId(id: string): void {
  try {
    localStorage.setItem(MPID_KEY, JSON.stringify({ id, at: Date.now() }))
  } catch {
    // 保存できない環境では、戻ってきた URL の mpid だけで確認する
  }
}

/** リダイレクト前に保存した merchantPaymentId を取得（3 時間たったものは捨てる） */
export function getPendingPayPayId(): string | null {
  try {
    const raw = localStorage.getItem(MPID_KEY)
    if (!raw) return null
    let entry: { id?: unknown; at?: unknown }
    try {
      entry = JSON.parse(raw) as { id?: unknown; at?: unknown }
    } catch {
      return raw // 以前の形式（支払いIDだけ）
    }
    if (typeof entry.id !== 'string') return null
    if (typeof entry.at === 'number' && Date.now() - entry.at > MPID_TTL_MS) {
      localStorage.removeItem(MPID_KEY)
      return null
    }
    return entry.id
  } catch {
    return null
  }
}

/** 確認後に保存済みの merchantPaymentId を破棄 */
export function clearPendingPayPayId(): void {
  try {
    localStorage.removeItem(MPID_KEY)
  } catch {
    // 無視
  }
}
