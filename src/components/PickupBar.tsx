import { ClockIcon, StoreIcon } from '@/components/icons'

// 受け取り情報の帯（メニュー画面の上部）。
export function PickupBar() {
  return (
    <div className="bg-surface">
      <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-2.5 text-[13px] text-ink-sub">
        <span className="flex shrink-0 items-center gap-1">
          <StoreIcon className="h-4 w-4" />
          受取：<span className="font-bold text-ink">LiSA校食堂</span>
        </span>
        <span className="h-3 w-px bg-ink-line" aria-hidden="true" />
        <span className="flex min-w-0 items-center gap-1">
          <ClockIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">できあがり次第お知らせ</span>
        </span>
      </div>
    </div>
  )
}
