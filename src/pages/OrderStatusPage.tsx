import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getOrderRepository } from '@/lib/orders'
import { itemKey, optionSummary } from '@/lib/menuOptions'
import { AppHeader } from '@/components/AppHeader'
import { CheckIcon } from '@/components/icons'
import { STATUS_LABEL, type Order, type OrderStatus } from '@/types/order'
import { beep, vibrate } from '@/lib/sound'

const STEPS: OrderStatus[] = ['paid', 'preparing', 'completed']

export function OrderStatusPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const prevStatus = useRef<OrderStatus | null>(null)

  useEffect(() => {
    if (!orderId) return
    const unsub = getOrderRepository().subscribeOrder(orderId, (o) => {
      setOrder(o)
      setLoading(false)
      // completed への遷移を検知したら通知音＋バイブ
      if (
        o &&
        o.status === 'completed' &&
        prevStatus.current !== null &&
        prevStatus.current !== 'completed'
      ) {
        beep(2)
        vibrate()
      }
      if (o) prevStatus.current = o.status
    })
    return unsub
  }, [orderId])

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

  const currentStep = STEPS.indexOf(order.status)
  const done = order.status === 'completed'

  return (
    <div className="min-h-dvh bg-white pb-10">
      <AppHeader title="LiSA校食堂" />
      <main className="mx-auto max-w-md px-4">
        <section className="pt-8 text-center">
          <p className="text-[13px] font-bold text-ink-sub">注文番号</p>
          <p className="mt-1 text-[64px] font-bold leading-none tabular-nums">
            {order.orderNumber}
          </p>
          <p className="mt-3 text-[15px] font-bold">{STATUS_LABEL[order.status]}</p>
        </section>

        {done ? (
          <div
            role="status"
            className="mt-6 flex items-center gap-3 rounded-lg bg-success px-4 py-4 text-white"
          >
            <CheckIcon className="h-7 w-7 shrink-0" />
            <div>
              <p className="text-base font-bold">お受け取りいただけます</p>
              <p className="text-sm text-white/90">
                カウンターで注文番号をお伝えください
              </p>
            </div>
          </div>
        ) : (
          <section className="mt-6">
            <ol className="grid grid-cols-3 gap-1.5" aria-label="注文の進み具合">
              {STEPS.map((s, idx) => {
                const reached = idx <= currentStep
                return (
                  <li key={s} aria-current={idx === currentStep ? 'step' : undefined}>
                    <span
                      className={`block h-1.5 rounded-full ${
                        reached ? 'bg-ink' : 'bg-ink-line'
                      }`}
                    />
                    <span
                      className={`mt-2 block text-center text-xs ${
                        reached ? 'font-bold text-ink' : 'text-ink-faint'
                      }`}
                    >
                      {STATUS_LABEL[s]}
                    </span>
                  </li>
                )
              })}
            </ol>
            <p className="mt-5 text-center text-[13px] leading-relaxed text-ink-sub">
              できあがったら、この画面と通知音でお知らせします。
              <br />
              画面を開いたままお待ちください。
            </p>
          </section>
        )}

        <section className="mt-8">
          <h2 className="pb-2 text-[15px] font-bold">ご注文内容</h2>
          <ul className="border-t border-ink-line">
            {order.items.map((i) => {
              const summary = optionSummary(i)
              return (
                <li
                  key={itemKey(i)}
                  className="flex justify-between gap-3 border-b border-ink-line py-3 text-[15px]"
                >
                  <span className="min-w-0">
                    <span className="block">
                      {i.name}
                      <span className="ml-1 text-ink-sub">× {i.quantity}</span>
                    </span>
                    {summary && (
                      <span className="block text-[13px] text-ink-sub">
                        {summary}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    ¥{(i.price * i.quantity).toLocaleString()}
                  </span>
                </li>
              )
            })}
          </ul>
          <div className="flex items-baseline justify-between py-3">
            <span className="font-bold">合計</span>
            <span className="text-lg font-bold tabular-nums">
              ¥{order.total.toLocaleString()}
            </span>
          </div>
        </section>

        <Link
          to="/menu"
          className="mt-4 flex h-[52px] w-full items-center justify-center rounded-lg border border-ink-line font-bold"
        >
          メニューに戻る
        </Link>
      </main>
    </div>
  )
}
