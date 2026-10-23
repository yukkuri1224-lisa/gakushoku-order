import { Link } from 'react-router-dom'
import { DiningIcon, StoreIcon } from '@/components/icons'
import { useDiningStore } from '@/store/dining'
import { DINING_LABEL } from '@/types/order'

// メニュー画面上部の帯。今のご利用方法と受け取り場所を常に見せ、すぐ変えられるようにする。
export function PickupBar() {
  const option = useDiningStore((s) => s.option)
  return (
    <div className="bg-surface">
      <div className="mx-auto flex h-11 max-w-md items-center gap-3 px-4 text-[13px]">
        {option && (
          <>
            <span className="flex shrink-0 items-center gap-1.5 font-bold text-ink">
              <DiningIcon option={option} className="h-4 w-4" />
              {DINING_LABEL[option]}
            </span>
            <span className="h-3 w-px bg-ink-line" aria-hidden="true" />
          </>
        )}
        <span className="flex min-w-0 items-center gap-1 text-ink-sub">
          <StoreIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">LiSA校食堂</span>
        </span>
        <Link
          to="/start"
          aria-label="ご利用方法を変更"
          className="ml-auto flex h-11 shrink-0 items-center px-1 font-bold underline underline-offset-4"
        >
          変更
        </Link>
      </div>
    </div>
  )
}
