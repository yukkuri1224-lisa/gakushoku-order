import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { itemKey } from '@/lib/menuOptions'
import { queueAhead } from '@/lib/orderProgress'
import { useActiveOrders, useCompletionAlert, useOrder } from '@/hooks/useOrders'
import { AppHeader } from '@/components/AppHeader'
import { OptionTags } from '@/components/OptionTags'
import { ReadyOverlay } from '@/components/ReadyOverlay'
import { Section } from '@/components/Section'
import { CheckIcon } from '@/components/icons'
import { DINING_LABEL, type Order, type OrderStatus } from '@/types/order'

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'paid', label: '受付済み' },
  { status: 'preparing', label: '調理中' },
  { status: 'completed', label: 'できあがり' },
]

function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** 丸と線のステッパー（受付済み → 調理中 → できあがり） */
function ProgressStepper({ status }: { status: OrderStatus }) {
  const current = STEPS.findIndex((s) => s.status === status)
  return (
    <ol className="mt-6 flex items-start" aria-label="注文の進み具合">
      {STEPS.map((s, idx) => {
        const reached = idx <= current
        const isCurrent = idx === current
        return (
          <li
            key={s.status}
            aria-current={isCurrent ? 'step' : undefined}
            className="relative flex flex-1 flex-col items-center"
          >
            {idx > 0 && (
              <span
                aria-hidden="true"
                className={`absolute right-1/2 top-[9px] h-0.5 w-full ${
                  reached ? 'bg-ink' : 'bg-ink-line'
                }`}
              />
            )}
            <span
              className={`relative z-10 h-5 w-5 rounded-full border-2 ${
                reached ? 'border-ink bg-ink' : 'border-ink-line bg-white'
              } ${isCurrent ? 'ring-4 ring-ink/15' : ''}`}
            />
            <span
              className={`mt-2 text-xs ${reached ? 'font-bold text-ink' : 'text-ink-faint'}`}
            >
              {s.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** 待ち状況のひとこと（根拠のない待ち時間は出さず、前の件数で伝える） */
function WaitingNote({ order, active }: { order: Order; active: Order[] }) {
  if (order.status === 'preparing') {
    return <p className="mt-5 text-center text-sm font-bold">ただいまお作りしています</p>
  }
  if (order.status !== 'paid') return null
  const ahead = queueAhead(order, active)
  return (
    <p className="mt-5 text-center text-sm font-bold">
      {ahead > 0 ? (
        <>
          あなたの前に <span className="text-lg tabular-nums">{ahead}</span> 件の注文があります
        </>
      ) : (
        'まもなく調理を始めます'
      )}
    </p>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-ink-sub">{label}</dt>
      <dd className="text-right font-bold">{value}</dd>
    </div>
  )
}

export function OrderStatusPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { order, loading } = useOrder(orderId)
  const active = useActiveOrders()
  const watched = useMemo(() => (order ? [order] : []), [order])
  const { ready, dismiss } = useCompletionAlert(watched)

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6 text-sm text-ink-sub">
        読み込み中…
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-dvh flex-col">
        <AppHeader title="LiSA校食堂" />
        <main className="mx-auto w-full max-w-md flex-1 px-4 pt-12 text-center">
          <h2 className="text-lg font-bold">注文が見つかりませんでした</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-sub">
            お支払い済みの場合は、この画面をスタッフにお見せください。
          </p>
          <p className="mt-2 break-all text-xs text-ink-faint">注文ID：{orderId}</p>
          <Link
            to="/menu"
            className="mt-8 flex h-[52px] w-full items-center justify-center rounded-lg bg-ink font-bold text-white"
          >
            メニューに戻る
          </Link>
        </main>
      </div>
    )
  }

  const done = order.status === 'completed'

  return (
    <div className="min-h-dvh bg-white pb-10">
      <AppHeader title="LiSA校食堂" />
      <main className="mx-auto max-w-md">
        {done ? (
          <div
            role="status"
            className="mx-4 mt-5 flex items-center gap-3 rounded-lg bg-success px-4 py-4 text-white"
          >
            <CheckIcon className="h-7 w-7 shrink-0" />
            <div>
              <p className="text-base font-bold">できあがりました</p>
              <p className="text-sm text-white/90">カウンターで注文番号をお伝えください</p>
            </div>
          </div>
        ) : (
          <div className="px-4 pt-6 text-center">
            <h1 className="text-xl font-bold">ご注文ありがとうございました</h1>
            <p className="mt-1 text-[13px] text-ink-sub">
              できあがったら、この画面と通知音でお知らせします
            </p>
          </div>
        )}

        <section className="mx-4 mt-5 rounded-lg bg-surface px-5 pb-2 pt-5">
          <p className="text-center text-[13px] font-bold text-ink-sub">注文番号</p>
          <p className="text-center text-[64px] font-bold leading-none tabular-nums">
            {order.orderNumber}
          </p>
          <ProgressStepper status={order.status} />
          <WaitingNote order={order} active={active} />
          <dl className="mt-5 divide-y divide-ink-line border-t border-ink-line text-[15px]">
            {order.diningOption && (
              <Row label="ご利用方法" value={DINING_LABEL[order.diningOption]} />
            )}
            <Row label="受け取り場所" value="LiSA校食堂" />
            <Row label="注文日時" value={formatDateTime(order.createdAt)} />
          </dl>
        </section>

        <div className="mt-5 border-t-8 border-surface" />
        <Section title="受け取り方">
          <ol className="list-decimal space-y-1 pl-5 text-[15px] leading-relaxed">
            <li>できあがったら、通知音でお知らせします</li>
            <li>カウンターで注文番号をお伝えください</li>
            <li>商品をお受け取りください</li>
          </ol>
        </Section>

        <Section title="ご注文内容">
          <ul className="border-t border-ink-line">
            {order.items.map((i) => (
              <li
                key={itemKey(i)}
                className="flex justify-between gap-3 border-b border-ink-line py-3 text-[15px]"
              >
                <span className="min-w-0">
                  <span className="block">
                    {i.name}
                    <span className="ml-1 text-ink-sub">× {i.quantity}</span>
                  </span>
                  <span className="mt-1 block">
                    <OptionTags item={i} />
                  </span>
                </span>
                <span className="shrink-0 tabular-nums">
                  ¥{(i.price * i.quantity).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between pt-3">
            <span className="font-bold">合計（税込）</span>
            <span className="text-lg font-bold tabular-nums">
              ¥{order.total.toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-right text-[13px] text-ink-sub">
            お支払い：{order.paymentMethod === 'paypay' ? 'PayPay' : 'PayPay（デモ）'}
          </p>
        </Section>

        <div className="px-4 pt-5">
          <Link
            to="/menu"
            className="flex h-[52px] w-full items-center justify-center rounded-lg border border-ink-line font-bold"
          >
            追加で注文する
          </Link>
        </div>
      </main>
      {ready && <ReadyOverlay order={ready} onClose={dismiss} />}
    </div>
  )
}
