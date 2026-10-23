import { useSyncExternalStore } from 'react'
import { BellIcon } from '@/components/icons'
import { isSoundReady, playChime, subscribeSound, unlockSound } from '@/lib/sound'

// 通知音の状態。ブラウザは画面をタップするまで音を出させないため、
// まだ鳴らせないときは「通知音をオンにする」ボタンを出す（押すと試しに 1 回鳴らす）。
export function SoundButton({ className = '' }: { className?: string }) {
  const ready = useSyncExternalStore(subscribeSound, isSoundReady, () => false)
  if (ready) {
    return (
      <span
        className={`inline-flex h-9 items-center gap-1.5 rounded-full bg-success/10 px-3 text-[13px] font-bold text-success ${className}`}
      >
        <BellIcon className="h-4 w-4" />
        通知音オン
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={() => {
        unlockSound()
        playChime(1)
      }}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full bg-brand px-3.5 text-[13px] font-bold text-white shadow-float ${className}`}
    >
      <BellIcon className="h-4 w-4" />
      通知音をオンにする
    </button>
  )
}
