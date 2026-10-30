import { useState, useSyncExternalStore } from 'react'
import { CloseIcon, ShareIcon } from '@/components/icons'
import {
  canPromptInstall,
  installMethod,
  isStandalone,
  isTouchMac,
  promptInstall,
  subscribeInstall,
} from '@/lib/install'

const DISMISS_KEY = 'gakushoku.installGuide.dismissed'

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

// 「ホーム画面に追加」の案内。スマホで、まだホーム画面から開いていないときだけ出す。
// Android の Chrome などはボタンで追加、iPhone・iPad は共有ボタンからの手順を出す。閉じたら次から出さない。
export function InstallGuide({ className = '' }: { className?: string }) {
  const canPrompt = useSyncExternalStore(subscribeInstall, canPromptInstall, () => false)
  const [dismissed, setDismissed] = useState(readDismissed)
  const method = installMethod({
    ua: navigator.userAgent,
    standalone: isStandalone(),
    canPrompt,
    touchMac: isTouchMac(),
  })
  if (dismissed || method === 'installed' || method === 'none') return null

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // 保存できなくても、この画面では閉じる
    }
  }

  return (
    <section aria-label="ホーム画面に追加" className={`rounded-2xl bg-white p-4 shadow-card ${className}`}>
      <div className="flex items-start gap-3">
        <img src="/icon-192.png" alt="" className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold">ホーム画面に追加できます</p>
          <p className="mt-0.5 text-[13px] text-ink-sub">アプリのように、すぐ開けます。</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="案内を閉じる"
          className="-mr-2 -mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-sub"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>
      {method === 'prompt' ? (
        <button
          type="button"
          onClick={() => void promptInstall()}
          className="mt-3 h-11 w-full rounded-full bg-ink text-sm font-bold text-white"
        >
          ホーム画面に追加する
        </button>
      ) : (
        <ol className="mt-3 space-y-1.5 rounded-xl bg-cream px-4 py-3 text-[13px] leading-relaxed">
          <li className="flex items-center gap-1.5">
            <span className="font-bold">1.</span>
            画面の共有ボタン
            <ShareIcon className="h-5 w-5 text-ink" />
            を押す
          </li>
          <li>
            <span className="font-bold">2.</span>「ホーム画面に追加」を選ぶ
          </li>
        </ol>
      )}
    </section>
  )
}
