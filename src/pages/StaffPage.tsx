import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOrderRepository } from '@/lib/orders'
import { changedOptions, itemKey } from '@/lib/menuOptions'
import { StatusBadge } from '@/components/StatusBadge'
import { PasscodeScreen } from '@/components/PasscodeScreen'
import { STAFF_KEY, STAFF_PASSWORD, isGateOpen, openGate } from '@/lib/gate'
import type { Order, OrderStatus, SelectedOption } from '@/types/order'
import { beep } from '@/lib/sound'

export function StaffPage() {
  const [authed, setAuthed] = useState(() => isGateOpen(STAFF_KEY))
  if (!authed) {
    return (
      <PasscodeScreen
        eyebrow="LiSA校 学食"
        title="厨房ボード"
        description="スタッフ用の画面です。新しい注文が入ると通知音でお知らせします。"
        label="スタッフ用の合言葉"
        submitLabel="ひらく"
        onSubmit={(pw) => {
          if (pw !== STAFF_PASSWORD) return false
          openGate(STAFF_KEY)
          setAuthed(true)
          return true
        }}
        footer={{ to: '/', label: '注文画面に戻る' }}
      />
    )
  }
  return <StaffBoard />
}

/**
 * 初期値から変えた選択肢の表示。
 * 追加料金のあるもの（大盛り）はアクセント、それ以外（福神漬けなし等）は注意色で目立たせる。
 */
function OptionChip({ option }: { option: SelectedOption }) {
  const cls =
    option.priceDelta > 0
      ? 'bg-accent-bg text-accent-fg'
      : 'border border-danger text-danger'
  return (
    <span className={`rounded px-2 py-0.5 text-sm font-bold ${cls}`}>
      {option.summaryLabel ?? option.choiceLabel}
    </span>
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
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-30 border-b border-ink-line bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-base font-bold">厨房ボード</h1>
            <p className="text-sm text-ink-sub">
              進行中 <span className="font-bold tabular-nums text-ink">{orders.length}</span> 件
            </p>
          </div>
          <Link
            to="/"
            className="flex h-11 items-center text-sm text-ink-sub underline underline-offset-4"
          >
            注文画面へ
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4">
        {orders.length === 0 ? (
          <p className="py-24 text-center text-sm text-ink-sub">
            進行中の注文はありません
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map((o) => (
              <article
                key={o.id}
                className="flex flex-col rounded-lg border border-ink-line bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="flex items-baseline gap-1">
                    <span className="text-xs text-ink-sub">No.</span>
                    <span className="text-[32px] font-bold leading-none tabular-nums">
                      {o.orderNumber}
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs tabular-nums text-ink-sub">
                      {new Date(o.createdAt).toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <StatusBadge status={o.status} />
                  </div>
                </div>

                <ul className="mt-3 flex-1 border-t border-ink-line">
                  {o.items.map((i) => {
                    const changed = changedOptions(i)
                    return (
                      <li key={itemKey(i)} className="border-b border-ink-line py-2.5">
                        <div className="flex justify-between gap-2 text-base">
                          <span className="font-bold">{i.name}</span>
                          <span className="font-bold tabular-nums">× {i.quantity}</span>
                        </div>
                        {changed.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {changed.map((op) => (
                              <OptionChip key={op.groupId} option={op} />
                            ))}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>

                <div className="mt-3 flex gap-2">
                  {o.status === 'paid' && (
                    <button
                      type="button"
                      onClick={() => setStatus(o.id, 'preparing')}
                      className="h-12 flex-1 rounded-lg border border-ink font-bold"
                    >
                      調理開始
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setStatus(o.id, 'completed')}
                    className="h-12 flex-1 rounded-lg bg-ink font-bold text-white"
                  >
                    調理完了
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
