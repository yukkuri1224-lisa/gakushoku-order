import { useEffect, useState } from 'react'
import { BellIcon, CheckIcon } from '@/components/icons'
import { enablePush, pushState, registerDeviceForPush, type PushState } from '@/lib/push'

// 「できあがったらスマホに通知」。この端末を通知の宛先に加える（アカウントごと。一度で以後の注文すべて）。
// アプリを閉じていても、調理完了で通知が届く。
// installHint=false のときは、iPhone の「ホーム画面に追加」の案内を出さない（別の案内があるとき）。
export function NotifyCard({
  className = '',
  installHint = true,
}: {
  className?: string
  installHint?: boolean
}) {
  const [state, setState] = useState<PushState>(() => pushState())

  // 許可済みなら、この端末の宛先を新しくしておく（宛先は時々変わるため。開くたびに 1 回）
  useEffect(() => {
    if (state === 'granted') void registerDeviceForPush().catch((e) => console.warn(e))
  }, [state])

  if (!installHint && state === 'needs-install') return null
  return (
    <NotifyCardView
      className={className}
      state={state}
      onEnable={async () => {
        try {
          setState(await enablePush())
        } catch (e) {
          console.warn(e)
          setState(pushState())
        }
      }}
    />
  )
}

export function NotifyCardView({
  state,
  onEnable,
  className = '',
}: {
  state: PushState
  onEnable: () => Promise<void>
  className?: string
}) {
  const [busy, setBusy] = useState(false)
  if (state === 'unsupported') return null
  const box = `${className} flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-card`
  const icon = (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
      <BellIcon className="h-5 w-5" />
    </span>
  )

  if (state === 'granted') {
    return (
      <div className={box}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success text-white">
          <CheckIcon className="h-5 w-5" />
        </span>
        <p className="text-sm font-bold">できあがったら、この端末に通知でお知らせします</p>
      </div>
    )
  }
  if (state === 'denied') {
    return (
      <div className={box}>
        {icon}
        <p className="text-[13px] leading-relaxed text-ink-sub">
          通知がブロックされています。受け取るには、ブラウザやスマホの設定でこのサイトの通知を許可してください。
        </p>
      </div>
    )
  }
  if (state === 'needs-install') {
    return (
      <div className={box}>
        {icon}
        <p className="text-[13px] leading-relaxed text-ink-sub">
          iPhone は、このサイトを「ホーム画面に追加」して開くと、できあがりの通知を受け取れます。
        </p>
      </div>
    )
  }
  return (
    <div className={className}>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          await onEnable()
          setBusy(false)
        }}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white text-base font-bold text-brand shadow-card disabled:opacity-60"
      >
        <BellIcon className="h-5 w-5" />
        できあがったらスマホに通知する
      </button>
      <p className="mt-1.5 text-center text-xs text-ink-sub">
        一度オンにすれば、これからの注文すべてで、アプリを閉じていても届きます
      </p>
    </div>
  )
}
