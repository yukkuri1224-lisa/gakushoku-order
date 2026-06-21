import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getOrderRepository } from '@/lib/orders'
import { SyncModeBanner } from '@/components/SyncModeBanner'
import { StatusBadge } from '@/components/StatusBadge'
import { STAFF_KEY, STAFF_PASSWORD, isGateOpen, openGate } from '@/lib/gate'
import type { Order, OrderStatus } from '@/types/order'
import { beep } from '@/lib/sound'

export function StaffPage() {
  const [authed, setAuthed] = useState(() => isGateOpen(STAFF_KEY))
  if (!authed) return <StaffGate onPass={() => setAuthed(true)} />
  return <StaffBoard />
}

function StaffGate({ onPass }: { onPass: () => void }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (pw === STAFF_PASSWORD) {
      openGate(STAFF_KEY)
      onPass()
    } else {
      setError(true)
    }
  }

  return (
    <div className="app-bg flex min-h-full flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-block animate-float text-7xl">🧑‍🍳</div>
          <h1 className="text-2xl font-black text-gray-900">食堂スタッフ画面</h1>
          <p className="mt-1 text-sm text-gray-500">スタッフ用合言葉を入力</p>
        </div>
        <form
          onSubmit={submit}
          className="space-y-3 rounded-3xl bg-white/80 p-5 shadow-card ring-1 ring-black/5 backdrop-blur"
        >
          <input
            type="password"
            value={pw}
            onChange={(e) => {
              setPw(e.target.value)
              setError(false)
            }}
            placeholder="スタッフ合言葉"
            autoFocus
            className={`w-full rounded-2xl border-2 px-4 py-3 text-center text-lg outline-none transition ${
              error
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 focus:border-brand'
            }`}
          />
          {error && (
            <p className="text-center text-sm font-bold text-red-500">
              合言葉が違います 🙅
            </p>
          )}
          <button
            type="submit"
            className="btn-press w-full rounded-2xl bg-brand py-3.5 text-lg font-bold text-white shadow-lg"
          >
            入る →
          </button>
        </form>
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="text-sm font-medium text-gray-400 underline-offset-4 hover:underline"
          >
            注文画面に戻る
          </Link>
        </div>
      </div>
    </div>
  )
}

function StaffBoard() {
  const [orders, setOrders] = useState<Order[]>([])
  const knownIds = useRef<Set<string> | null>(null)
  const repo = getOrderRepository()

  useEffect(() => {
    const unsub = repo.subscribeActiveOrders((list) => {
      setOrders(list)
      const ids = new Set(list.map((o) => o.id))
      // 新規注文が来たら通知音（初回ロードは鳴らさない）
      if (knownIds.current) {
        const hasNew = list.some((o) => !knownIds.current?.has(o.id))
        if (hasNew) beep(1)
      }
      knownIds.current = ids
    })
    return unsub
    // repo はシングルトンのため依存配列は空でよい
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setStatus = (id: string, status: OrderStatus) => {
    void repo.updateStatus(id, status)
  }

  return (
    <div className="app-bg min-h-full">
      <header className="bg-gradient-to-br from-gray-800 to-gray-900 px-5 py-5 text-white shadow-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <h1 className="text-xl font-black">🧑‍🍳 厨房ボード</h1>
            <p className="text-xs text-white/70">
              進行中の注文 {orders.length} 件
            </p>
          </div>
          <Link
            to="/"
            className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white/90"
          >
            注文画面へ
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-4">
        <SyncModeBanner />

        {orders.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mb-2 text-6xl">🍽️</div>
            <p className="text-gray-400">進行中の注文はありません</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {orders.map((o) => (
              <div
                key={o.id}
                className="animate-slide-up rounded-3xl bg-white p-4 shadow-card ring-1 ring-black/5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-gray-400">No.</span>
                    <span className="text-4xl font-black text-brand">
                      {o.orderNumber}
                    </span>
                  </div>
                  <StatusBadge status={o.status} />
                </div>

                <ul className="mb-3 space-y-1 rounded-2xl bg-gray-50 p-3 text-sm text-gray-700">
                  {o.items.map((i) => (
                    <li key={i.name} className="flex justify-between">
                      <span className="font-medium">{i.name}</span>
                      <span className="font-bold text-gray-500">
                        × {i.quantity}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mb-3 flex justify-between text-sm">
                  <span className="text-gray-400">
                    {new Date(o.createdAt).toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="font-extrabold text-gray-800">
                    ¥{o.total.toLocaleString()}
                  </span>
                </div>

                <div className="flex gap-2">
                  {o.status === 'paid' && (
                    <button
                      onClick={() => setStatus(o.id, 'preparing')}
                      className="btn-press flex-1 rounded-full border-2 border-amber-300 bg-amber-50 py-2.5 font-bold text-amber-700"
                    >
                      🍳 調理開始
                    </button>
                  )}
                  <button
                    onClick={() => setStatus(o.id, 'completed')}
                    className="btn-press flex-1 rounded-full bg-green-600 py-2.5 font-bold text-white shadow"
                  >
                    ✅ 調理完了
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
