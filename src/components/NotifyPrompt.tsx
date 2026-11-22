import { useEffect, useRef, useState } from 'react'
import { BellIcon } from '@/components/icons'
import { enablePush, pushState, type PushState } from '@/lib/push'

// ログインしたあと（ご利用方法を選ぶ画面）で、「できあがったら通知を受け取りますか？」と聞く。
// まだ決めていない（許可もブロックもしていない）ときだけ、開くたびに 1 回（sessionStorage）。
// iPhone の Safari のように通知が使えないときは聞かない（ホーム画面に追加の案内が別にある）。
const PROMPTED_KEY = 'gakushoku.notifyPrompted'

export function shouldPromptNotify(state: PushState, promptedThisSession: boolean): boolean {
  return state === 'default' && !promptedThisSession
}

function promptedThisSession(): boolean {
  try {
    return sessionStorage.getItem(PROMPTED_KEY) === '1'
  } catch {
    return false
  }
}

function markPrompted(): void {
  try {
    sessionStorage.setItem(PROMPTED_KEY, '1')
  } catch {
    // 保存できなくても、この画面では閉じる
  }
}

/** 答えたあとに呼ぶ（許可・ブロックの結果。最初の画面の通知のカードも新しくする） */
export function NotifyPrompt({ onAnswered }: { onAnswered?: (state: PushState) => void }) {
  const [open, setOpen] = useState(() => shouldPromptNotify(pushState(), promptedThisSession()))
  if (!open) return null
  const close = () => {
    markPrompted()
    setOpen(false)
  }
  return (
    <NotifyPromptView
      onEnable={async () => {
        let state: PushState
        try {
          state = await enablePush()
        } catch (e) {
          console.warn(e)
          state = pushState()
        }
        close()
        onAnswered?.(state)
      }}
      onLater={close}
    />
  )
}

export function NotifyPromptView({
  onEnable,
  onLater,
}: {
  onEnable: () => Promise<void>
  onLater: () => void
}) {
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/45 p-4 sm:items-center">
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notify-prompt-title"
        className="w-full max-w-sm animate-sheet-up rounded-3xl bg-white p-6 text-center shadow-sheet outline-none"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
          <BellIcon className="h-7 w-7" />
        </span>
        <h2 id="notify-prompt-title" className="text-keep mt-4 text-lg font-bold">
          できあがったら、
          <wbr />
          通知を受け取りますか？
        </h2>
        <p className="text-keep mt-2 text-sm leading-relaxed text-ink-sub">
          料理ができたら、アプリを閉じていてもこのスマホにお知らせします。一度オンにすれば、これからの注文すべてで届きます。
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            await onEnable()
            setBusy(false)
          }}
          className="mt-5 h-14 w-full rounded-full bg-brand text-base font-bold text-white shadow-float disabled:opacity-60"
        >
          通知を受け取る
        </button>
        <button
          type="button"
          onClick={onLater}
          className="mt-2 h-12 w-full rounded-full text-sm font-bold text-ink-sub"
        >
          あとで
        </button>
      </div>
    </div>
  )
}
