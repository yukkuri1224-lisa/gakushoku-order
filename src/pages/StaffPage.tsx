import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOrderRepository } from '@/lib/orders'
import { changedOptions, itemKey } from '@/lib/menuOptions'
import { StatusBadge } from '@/components/StatusBadge'
import { PasscodeScreen } from '@/components/PasscodeScreen'
import { ProcessingScreen } from '@/components/ProcessingScreen'
import { StaffLoginScreen } from '@/components/StaffLoginScreen'
import { SoldOutPanel } from '@/components/SoldOutPanel'
import { SoundButton } from '@/components/SoundButton'
import { MealgoWordmark } from '@/components/Logo'
import { useLoginState } from '@/hooks/useLogin'
import { useSoldOut } from '@/hooks/useSoldOut'
import { loginMode, signInStaff, signOutAccount, type LoginState } from '@/lib/auth'
import { STAFF_KEY, STAFF_PASSWORD, isGateOpen, openGate } from '@/lib/gate'
import {
  DINING_SHORT,
  type DiningOption,
  type Order,
  type OrderStatus,
  type SelectedOption,
} from '@/types/order'
import { playChime } from '@/lib/sound'

// 厨房ボードの入口。アカウントでのログイン（VITE_LOGIN_DOMAIN あり）なら、スタッフのアカウントだけ。
// 合言葉のデモでは、スタッフ用の合言葉。
export function StaffPage() {
  return loginMode === 'account' ? <StaffAccount /> : <StaffPasscodeGate />
}

function StaffAccount() {
  const login = useLoginState()
  return <StaffAccountGate login={login} onSignIn={signInStaff} onSignOut={signOutAccount} />
}

export function StaffAccountGate({
  login,
  onSignIn,
  onSignOut,
}: {
  login: LoginState
  onSignIn: (email: string, password: string) => Promise<void>
  onSignOut: () => Promise<void>
}) {
  if (login.status === 'loading') return <ProcessingScreen title="読み込み中…" description="" />
  if (login.status === 'signedIn' && login.role === 'staff') {
    return <StaffBoard account={{ email: login.email, onSignOut }} />
  }
  return (
    <StaffLoginScreen
      onSignIn={onSignIn}
      notice={
        login.status === 'signedIn'
          ? '学生のアカウントでログインしています。厨房ボードを使うには、スタッフのアカウントでログインし直してください。'
          : undefined
      }
    />
  )
}

function StaffPasscodeGate() {
  const [authed, setAuthed] = useState(() => isGateOpen(STAFF_KEY))
  if (!authed) {
    return (
      <PasscodeScreen
        eyebrow="LiSA校食堂"
        title="厨房ボード"
        description="スタッフ用の画面です。新しい注文が入ると通知音でお知らせします。"
        label="スタッフ用の合言葉"
        submitLabel="ひらく"
        onSubmit={(pw) => {
          if (!STAFF_PASSWORD || pw !== STAFF_PASSWORD) return false
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
 * 初期値から変えた選択肢・毎回選ぶ選択肢の表示。
 * 追加料金のあるもの（大盛り）はアクセント、毎回選ぶもの（うどん／そば）は普通の枠、
 * それ以外（福神漬けなし等）は注意色で目立たせる。
 */
function OptionChip({ option }: { option: SelectedOption }) {
  const cls =
    option.priceDelta > 0
      ? 'bg-accent-bg text-accent-fg'
      : option.mustChoose
        ? 'border border-ink text-ink'
        : 'border border-danger text-danger'
  return (
    <span className={`rounded px-2 py-0.5 text-sm font-bold ${cls}`}>
      {option.summaryLabel ?? option.choiceLabel}
    </span>
  )
}

/**
 * ご利用方法のバッジ。容器が変わる「持ち帰り」を反転色で目立たせる。
 * 利用方法の選択を入れる前の注文（diningOption なし）には出さない。
 */
function DiningBadge({ option }: { option: DiningOption }) {
  const cls =
    option === 'takeout'
      ? 'bg-ink text-white'
      : 'border border-ink-line text-ink'
  return (
    <span className={`rounded px-2 py-1 text-sm font-bold ${cls}`}>
      {DINING_SHORT[option]}
    </span>
  )
}

function StaffBoard({
  account,
}: {
  /** アカウントでのログインのとき: ログイン中のアカウントとログアウト */
  account?: { email: string; onSignOut: () => Promise<void> }
}) {
  const [orders, setOrders] = useState<Order[]>([])
  const [tab, setTab] = useState<'orders' | 'soldOut'>('orders')
  const soldOut = useSoldOut()
  const knownIds = useRef<Set<string> | null>(null)
  const repo = getOrderRepository()

  useEffect(() => {
    const unsub = repo.subscribeActiveOrders((list) => {
      setOrders(list)
      const ids = new Set(list.map((o) => o.id))
      // 新規注文が来たら通知音（初回ロードは鳴らさない）
      if (knownIds.current) {
        const hasNew = list.some((o) => !knownIds.current?.has(o.id))
        if (hasNew) playChime(1)
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

  const tabClass = (active: boolean) =>
    `flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold ${
      active ? 'bg-ink text-white' : 'bg-white text-ink shadow-card'
    }`

  return (
    <div className="min-h-dvh bg-cream">
      <header className="sticky top-0 z-30 border-b border-ink-line/70 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <MealgoWordmark className="h-6" />
            <span aria-hidden="true" className="h-4 w-px shrink-0 bg-ink-line" />
            <h1 className="truncate text-base font-bold">厨房ボード</h1>
          </div>
          <div className="flex items-center gap-2">
            <SoundButton />
            <Link
              to="/"
              className="hidden h-11 items-center text-sm text-ink-sub underline underline-offset-4 sm:flex"
            >
              注文画面へ
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-4">
        <div role="tablist" aria-label="厨房ボードの表示" className="flex gap-2">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'orders'}
            onClick={() => setTab('orders')}
            className={tabClass(tab === 'orders')}
          >
            注文
            <span className="tabular-nums">{orders.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'soldOut'}
            onClick={() => setTab('soldOut')}
            className={tabClass(tab === 'soldOut')}
          >
            売り切れ
            {soldOut.size > 0 && (
              <span className="rounded-full bg-danger px-1.5 text-xs tabular-nums text-white">
                {soldOut.size}
              </span>
            )}
          </button>
        </div>
      </div>

      {tab === 'soldOut' ? (
        <main className="mx-auto max-w-5xl p-4">
          <SoldOutPanel soldOut={soldOut} />
        </main>
      ) : (
        <main className="mx-auto max-w-5xl p-4">
          {orders.length === 0 ? (
            <p className="py-24 text-center text-sm text-ink-sub">
              進行中の注文はありません
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {orders.map((o) => (
                <article
                  key={o.id}
                  className="flex flex-col rounded-2xl bg-white p-4 shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2">
                      <span className="flex items-baseline gap-1">
                        <span className="text-xs text-ink-sub">No.</span>
                        <span className="text-[32px] font-bold leading-none tabular-nums">
                          {o.orderNumber}
                        </span>
                      </span>
                      {o.diningOption && <DiningBadge option={o.diningOption} />}
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
                        className="h-12 flex-1 rounded-full border border-ink font-bold"
                      >
                        調理開始
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setStatus(o.id, 'completed')}
                      className="h-12 flex-1 rounded-full bg-brand font-bold text-white"
                    >
                      調理完了
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      )}

      {account && (
        <footer className="pb-safe mx-auto flex max-w-5xl items-center justify-center gap-2 px-4 pt-4 text-[13px] text-ink-sub">
          <span className="min-w-0 truncate">ログイン中：{account.email}</span>
          <button
            type="button"
            onClick={() => void account.onSignOut()}
            className="h-11 shrink-0 px-1 font-bold text-ink underline underline-offset-4"
          >
            ログアウト
          </button>
        </footer>
      )}
    </div>
  )
}
