import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getOrderRepository } from '@/lib/orders'
import { SyncModeBanner } from '@/components/SyncModeBanner'
import { STATUS_LABEL, type Order, type OrderStatus } from '@/types/order'
import { beep, vibrate } from '@/lib/sound'

const STEPS: OrderStatus[] = ['paid', 'preparing', 'completed']
const STEP_EMOJI: Record<OrderStatus, string> = {
  paid: '',
  preparing: '',
  completed: '',
}

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
      <div className="app-bg flex min-h-full items-center justify-center p-6 text-gray-400">
        読み込み中…
      </div>
    )
  }

  if (!order) {
    return (
      <div className="app-bg flex min-h-full flex-col items-center justify-center p-6 text-center">
        <div className="mb-3 text-6xl">🤔</div>
        <p className="mb-5 text-gray-500">注文が見つかりませんでした</p>
        <Link
          to="/menu"
          className="btn-press rounded-full bg-brand px-7 py-3 font-bold text-white shadow-lg"
        >
          メニューに戻る
        </Link>
      </div>
    )
  }

  const currentStep = STEPS.indexOf(order.status)
  const done = order.status === 'completed'

  return (
    <div className="app-bg min-h-full p-4">
      <div className="mx-auto max-w-md">
        <SyncModeBanner />

        {/* 注文番号ヒーロー */}
        <div
          className={`relative overflow-hidden rounded-3xl p-6 text-center text-white shadow-float ${
            done
              ? 'bg-gradient-to-br from-green-500 to-emerald-600'
              : 'bg-gradient-to-br from-brand to-brand-dark'
          }`}
        >
          <p className="text-sm font-medium text-white/80">注文番号</p>
          <p className="my-1 animate-pop-in text-8xl font-black tabular-nums leading-none drop-shadow">
            {order.orderNumber}
          </p>
          <div className="mt-3 flex justify-center">
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-bold backdrop-blur">
              {STATUS_LABEL[order.status]}
            </span>
          </div>
        </div>

        {done ? (
          <div className="mt-4 animate-pop-in rounded-3xl border-2 border-green-400 bg-green-50 p-6 text-center">
            <div className="animate-float text-6xl">🔔</div>
            <p className="mt-2 text-2xl font-black text-green-700">
              お受け取りいただけます！
            </p>
            <p className="mt-1 text-sm text-green-600">
              カウンターで注文番号をお伝えください
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-3xl bg-white p-5 shadow-card ring-1 ring-black/5">
            <ol className="flex items-start justify-between">
              {STEPS.map((s, idx) => {
                const reached = idx <= currentStep
                const active = idx === currentStep
                return (
                  <li
                    key={s}
                    className="relative flex flex-1 flex-col items-center"
                  >
                    {/* 接続線 */}
                    {idx < STEPS.length - 1 && (
                      <span
                        className={`absolute left-1/2 top-6 h-1 w-full ${
                          idx < currentStep ? 'bg-brand' : 'bg-gray-200'
                        }`}
                      />
                    )}
                    <div
                      className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full text-2xl transition ${
                        reached
                          ? 'bg-brand text-white shadow-md'
                          : 'bg-gray-100 text-gray-300'
                      } ${active ? 'animate-pulse ring-4 ring-brand/20' : ''}`}
                    >
                      {STEP_EMOJI[s]}
                    </div>
                    <span
                      className={`mt-2 text-xs font-bold ${
                        reached ? 'text-gray-800' : 'text-gray-400'
                      }`}
                    >
                      {STATUS_LABEL[s]}
                    </span>
                  </li>
                )
              })}
            </ol>
            <p className="mt-5 text-center text-sm text-gray-500">
              調理が完了するとこの画面でお知らせします 🔔
            </p>
          </div>
        )}

        {/* 注文内容 */}
        <div className="mt-4 rounded-3xl bg-white p-4 shadow-card ring-1 ring-black/5">
          <h2 className="mb-2 font-bold text-gray-700">注文内容</h2>
          <ul className="divide-y divide-gray-100 text-sm">
            {order.items.map((i) => (
              <li key={i.name} className="flex justify-between py-2">
                <span className="text-gray-700">
                  {i.name} × {i.quantity}
                </span>
                <span className="text-gray-600">
                  ¥{(i.price * i.quantity).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 font-bold">
            <span>合計</span>
            <span>¥{order.total.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/menu"
            className="text-sm font-medium text-gray-400 underline-offset-4 hover:underline"
          >
            もう一度注文する
          </Link>
        </div>
      </div>
    </div>
  )
}
