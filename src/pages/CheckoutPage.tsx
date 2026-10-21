import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { CartList } from '@/components/CartList'
import { CheckIcon, ClockIcon, StoreIcon } from '@/components/icons'
import { cartTotal, useCartStore } from '@/store/cart'
import {
  clearPendingPayPayId,
  confirmPayPayPayment,
  getPaymentProvider,
  getPendingPayPayId,
} from '@/lib/payment'
import { getOrderRepository } from '@/lib/orders'
import { toUserMessage } from '@/lib/errors'
import type { PaymentMethod } from '@/types/order'

/** 支払いは済んだが注文の登録に失敗した状態（同じIDで登録だけやり直せる） */
interface PaidButFailed {
  orderId: string
  method: PaymentMethod
  message: string
}

function newOrderId(): string {
  return 'mock-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const items = useCartStore((s) => s.items)
  const increment = useCartStore((s) => s.increment)
  const decrement = useCartStore((s) => s.decrement)
  const remove = useCartStore((s) => s.remove)

  const [paying, setPaying] = useState(false)
  // PayPay から戻った直後（?pp=return）は最初から確認画面を出す
  const [confirming, setConfirming] = useState(
    () => new URLSearchParams(window.location.search).get('pp') === 'return',
  )
  const [error, setError] = useState<string | null>(null)
  const [failed, setFailed] = useState<PaidButFailed | null>(null)
  const [retrying, setRetrying] = useState(false)

  const total = cartTotal(items)

  /**
   * 支払い済みの注文を登録して注文番号画面へ。
   * orderId を注文IDにするので、同じIDで何度呼んでも注文は1件だけ。
   */
  async function registerOrder(orderId: string, method: PaymentMethod) {
    const current = useCartStore.getState().items
    if (current.length === 0) {
      // 登録済みの後に戻ってきた等。注文番号画面で該当の注文を探す
      navigate(`/order/${orderId}`, { replace: true })
      return
    }
    try {
      const { id } = await getOrderRepository().createOrder(
        { items: current, total: cartTotal(current) },
        method,
        orderId,
      )
      if (method === 'paypay') clearPendingPayPayId()
      useCartStore.getState().clear()
      navigate(`/order/${id}`, { replace: true })
    } catch (e) {
      setFailed({ orderId, method, message: toUserMessage(e) })
    }
  }

  // PayPay の決済ページから戻ってきた時（?pp=return&mpid=...）の支払い確認 → 注文作成
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('pp') !== 'return') return
    const mpid = params.get('mpid') ?? getPendingPayPayId()
    if (!mpid) {
      setError('決済情報が見つかりませんでした')
      setConfirming(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const ok = await confirmPayPayPayment(mpid)
        if (cancelled) return
        if (!ok) {
          setError('PayPayの支払いが確認できませんでした。もう一度お試しください。')
          return
        }
        await registerOrder(mpid, 'paypay')
      } catch (e) {
        if (!cancelled) setError(toUserMessage(e))
      } finally {
        if (!cancelled) setConfirming(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // 初回マウント時のみ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePay = async () => {
    if (items.length === 0 || paying) return
    setError(null)
    setPaying(true)
    try {
      // 決済（mock=モーダル / paypay=リダイレクト）。VITE_PAYMENT_MODE で切替
      const result = await getPaymentProvider().pay(total, { items, total })
      // ※ paypay はここでリダイレクトするため以降は実行されない（戻った後に useEffect で処理）
      if (!result.success) {
        setPaying(false)
        return // ユーザーがキャンセル（mock）
      }
      await registerOrder(newOrderId(), result.paymentMethod)
    } catch (e) {
      setError(toUserMessage(e))
    }
    setPaying(false)
  }

  const retry = async () => {
    if (!failed || retrying) return
    setRetrying(true)
    await registerOrder(failed.orderId, failed.method)
    setRetrying(false)
  }

  // PayPay 戻り確認中
  if (confirming) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
        <div
          className="mb-5 h-10 w-10 animate-spin rounded-full border-[3px] border-ink-line border-t-ink"
          aria-hidden="true"
        />
        <p className="text-base font-bold">支払いを確認しています</p>
        <p className="mt-1 text-sm text-ink-sub">画面を閉じずにお待ちください</p>
      </div>
    )
  }

  // 支払い済み・注文登録に失敗
  if (failed) {
    return (
      <div className="flex min-h-dvh flex-col">
        <AppHeader title="注文の登録" />
        <main className="mx-auto w-full max-w-md flex-1 px-4 pt-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success text-white">
            <CheckIcon className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-xl font-bold">お支払いは完了しています</h2>
          <p className="mt-3 text-sm font-bold text-danger">
            注文の登録に失敗しました。
          </p>
          <p className="mt-1 text-sm text-ink-sub">{failed.message}</p>
          <button
            type="button"
            onClick={retry}
            disabled={retrying}
            className="mt-8 h-[52px] w-full rounded-lg bg-ink font-bold text-white disabled:opacity-60"
          >
            {retrying ? '登録しています…' : '注文の登録をやり直す'}
          </button>
          <p className="mt-4 text-[13px] leading-relaxed text-ink-sub">
            もう一度お支払いいただく必要はありません。
            <br />
            解決しない場合は、この画面をスタッフにお見せください。
          </p>
          <p className="mt-2 break-all text-xs text-ink-faint">
            支払いID：{failed.orderId}
          </p>
        </main>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col">
        <AppHeader title="注文の確認" back="/menu" />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 text-center">
          <p className="text-base font-bold">カートは空です</p>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          <Link
            to="/menu"
            className="mt-6 flex h-[52px] w-full items-center justify-center rounded-lg bg-ink font-bold text-white"
          >
            メニューを見る
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-white pb-32">
      <AppHeader title="注文の確認" back="/menu" />

      <main className="mx-auto max-w-md px-4">
        <section className="pt-5">
          <h2 className="pb-2 text-[15px] font-bold">受け取り</h2>
          <div className="rounded-lg border border-ink-line">
            <p className="flex items-center gap-3 border-b border-ink-line px-4 py-3 text-[15px]">
              <StoreIcon className="h-5 w-5 text-ink-sub" />
              LiSA校食堂
            </p>
            <p className="flex items-center gap-3 px-4 py-3 text-[15px]">
              <ClockIcon className="h-5 w-5 text-ink-sub" />
              できあがり次第、この画面でお知らせ
            </p>
          </div>
        </section>

        <section className="pt-7">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-[15px] font-bold">ご注文内容</h2>
            <Link
              to="/menu"
              className="flex h-11 items-center text-sm font-bold underline underline-offset-4"
            >
              商品を追加
            </Link>
          </div>
          <CartList
            items={items}
            onInc={increment}
            onDec={decrement}
            onRemove={remove}
          />
          <div className="flex items-baseline justify-between py-4">
            <span className="font-bold">合計</span>
            <span className="text-xl font-bold tabular-nums">
              ¥{total.toLocaleString()}
            </span>
          </div>
        </section>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-danger/30 px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        )}

        <ul className="mt-4 list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-ink-sub">
          <li>注文確定後のキャンセル・変更はできません。</li>
          <li>できあがったら、この画面と通知音でお知らせします。</li>
          <li>受け取りの際は、カウンターで注文番号をお伝えください。</li>
        </ul>
      </main>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-ink-line bg-white px-4 pt-3 shadow-sheet">
        <div className="mx-auto max-w-md">
          <button
            type="button"
            disabled={paying}
            onClick={handlePay}
            className="flex h-[52px] w-full items-center justify-center gap-1.5 rounded-lg bg-paypay text-base font-bold text-white disabled:opacity-60"
          >
            {paying ? (
              '処理中…'
            ) : (
              <>
                <span className="italic">PayPay</span>で支払う・
                <span className="tabular-nums">¥{total.toLocaleString()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
