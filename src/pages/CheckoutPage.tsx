import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { CartList } from '@/components/CartList'
import { DiningChoice } from '@/components/DiningChoice'
import { ProcessingScreen } from '@/components/ProcessingScreen'
import { Section } from '@/components/Section'
import { CheckIcon, StoreIcon } from '@/components/icons'
import { cartCount, cartTotal, useCartStore } from '@/store/cart'
import { useDiningStore } from '@/store/dining'
import { useSoldOut } from '@/hooks/useSoldOut'
import {
  confirmPayPayPayment,
  getPaymentProvider,
  getPendingPayPayId,
  paymentMode,
} from '@/lib/payment'
import { registerPaidOrder } from '@/lib/registerPaidOrder'
import { toUserMessage } from '@/lib/errors'
import { DINING_LABEL, type PaymentMethod } from '@/types/order'

/** 支払いは済んだが注文の登録に失敗した状態（同じIDで登録だけやり直せる） */
interface PaidButFailed {
  orderId: string
  method: PaymentMethod
  message: string
}

function newOrderId(): string {
  return 'mock-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// 注文内容の確認。受け取り場所・ご利用方法・お支払い方法・ご注文内容を確かめてから支払う。
export function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const items = useCartStore((s) => s.items)
  const increment = useCartStore((s) => s.increment)
  const decrement = useCartStore((s) => s.decrement)
  const remove = useCartStore((s) => s.remove)
  const dining = useDiningStore((s) => s.option)
  const setDining = useDiningStore((s) => s.setOption)
  const soldOut = useSoldOut()

  const [paying, setPaying] = useState(false)
  // PayPay から戻った直後（?pp=return）は最初から確認画面を出す
  const [confirming, setConfirming] = useState(
    () => new URLSearchParams(location.search).get('pp') === 'return',
  )
  const [registering, setRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [failed, setFailed] = useState<PaidButFailed | null>(null)
  const [retrying, setRetrying] = useState(false)

  const total = cartTotal(items)
  const count = cartCount(items)
  const hasSoldOut = items.some((i) => i.menuItemId !== undefined && soldOut.has(i.menuItemId))
  const blockedReason = hasSoldOut
    ? '売り切れの商品を削除してください'
    : !dining
      ? 'ご利用方法を選んでください'
      : null

  /** 支払い済みの注文を登録して注文番号画面へ（同じIDで何度呼んでも注文は1件だけ） */
  async function registerOrder(orderId: string, method: PaymentMethod) {
    setRegistering(true)
    try {
      // 中身が見つからないとき（登録済みの後に戻ってきた等）は、注文番号画面で該当の注文を探す
      const id = (await registerPaidOrder(orderId, method)) ?? orderId
      navigate(`/order/${id}`, { replace: true })
    } catch (e) {
      setFailed({ orderId, method, message: toUserMessage(e) })
    } finally {
      setRegistering(false)
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
        setConfirming(false)
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

  // PayPay の画面から「戻る」で戻った・ホーム画面のアプリに戻ったときに、
  // 支払いボタンが「処理中…」のまま止まらないようにする
  useEffect(() => {
    if (paymentMode !== 'paypay') return
    const reset = () => {
      if (document.visibilityState === 'visible') setPaying(false)
    }
    window.addEventListener('pageshow', reset)
    document.addEventListener('visibilitychange', reset)
    return () => {
      window.removeEventListener('pageshow', reset)
      document.removeEventListener('visibilitychange', reset)
    }
  }, [])

  const handlePay = async () => {
    if (items.length === 0 || paying || !dining || blockedReason) return
    setError(null)
    setPaying(true)
    try {
      // 決済（mock=モーダル / paypay=リダイレクト）。VITE_PAYMENT_MODE で切替
      const result = await getPaymentProvider().pay(total, {
        items,
        total,
        diningOption: dining,
      })
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

  if (confirming) return <ProcessingScreen title="支払いを確認しています" />
  if (registering && !failed) return <ProcessingScreen title="注文を確定しています…" />

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
            className="mt-8 h-14 w-full rounded-full bg-brand font-bold text-white disabled:opacity-60"
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
        <AppHeader title="注文内容の確認" back="/menu" />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 text-center">
          <p className="text-base font-bold">カートは空です</p>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          <Link
            to="/menu"
            className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-brand font-bold text-white shadow-float"
          >
            メニューを見る
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-dvh pb-48">
      <AppHeader title="注文内容の確認" back="/menu" />

      <main className="mx-auto max-w-md">
        <Section title="受け取り場所">
          <div className="flex items-center gap-3 rounded-xl bg-cream px-4 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand">
              <StoreIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[15px] font-bold">LiSA校食堂</p>
              <p className="text-[13px] text-ink-sub">
                できあがったら、この画面と通知音でお知らせします
              </p>
            </div>
          </div>
        </Section>

        <Section title="ご利用方法" titleId="dining-label">
          <DiningChoice value={dining} onChange={setDining} labelledBy="dining-label" />
          {dining === 'eat_in' && (
            <p className="mt-2 inline-block rounded-full bg-accent-bg px-2.5 py-1 text-xs font-bold text-accent-fg">
              席を確保してからご注文ください
            </p>
          )}
        </Section>

        <Section title="お支払い方法">
          <div className="flex h-14 items-center justify-between rounded-xl border border-brand bg-brand-soft px-4 ring-1 ring-brand">
            <span className="text-[17px] font-bold italic text-paypay">PayPay</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
              <CheckIcon className="h-3.5 w-3.5" />
            </span>
          </div>
        </Section>

        <Section
          title={`ご注文内容（${count}点）`}
          action={
            <Link
              to="/menu"
              className="flex h-9 items-center rounded-full bg-brand-soft px-3 text-sm font-bold text-brand-dark"
            >
              ＋ 商品を追加
            </Link>
          }
        >
          <CartList
            items={items}
            soldOutIds={soldOut}
            onInc={increment}
            onDec={decrement}
            onRemove={remove}
          />
          <div className="flex items-baseline justify-between pt-4">
            <span className="font-bold">合計（税込）</span>
            <span className="text-xl font-bold tabular-nums text-brand">
              ¥{total.toLocaleString()}
            </span>
          </div>
        </Section>

        <div className="px-4 pt-4">
          {error && (
            <p
              role="alert"
              className="mb-4 rounded-lg border border-danger/30 px-4 py-3 text-sm text-danger"
            >
              {error}
            </p>
          )}
          <ul className="list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-ink-sub">
            <li>注文を確定すると支払いが行われます。確定後のキャンセル・変更はできません。</li>
            <li>受け取りの際は、カウンターで注文番号をお伝えください。</li>
          </ul>
        </div>
      </main>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 rounded-t-3xl bg-white px-4 pt-3 shadow-sheet">
        <div className="mx-auto max-w-md">
          <div className="flex items-baseline justify-between gap-3 pb-2 text-[13px]">
            <span className="min-w-0 truncate text-ink-sub">
              LiSA校食堂（{dining ? DINING_LABEL[dining] : 'ご利用方法 未選択'}）
            </span>
            <span className="shrink-0">
              合計（税込）
              <span className="ml-1 text-base font-bold tabular-nums">
                ¥{total.toLocaleString()}
              </span>
            </span>
          </div>
          <button
            type="button"
            disabled={paying || blockedReason !== null}
            onClick={handlePay}
            className={`flex h-14 w-full items-center justify-center rounded-full text-base font-bold disabled:cursor-not-allowed ${
              blockedReason ? 'bg-surface text-ink-sub' : 'bg-paypay text-white disabled:opacity-60'
            }`}
          >
            {blockedReason ? (
              blockedReason
            ) : paying ? (
              '処理中…'
            ) : (
              <>
                <span className="mr-1 italic">PayPay</span>で支払う・
                <span className="tabular-nums">¥{total.toLocaleString()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
