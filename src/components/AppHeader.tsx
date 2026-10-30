import { Link } from 'react-router-dom'
import { BackIcon, CartIcon } from '@/components/icons'
import { MealgoWordmark } from '@/components/Logo'

// 画面上部の固定ヘッダー。
//   back を渡すと左に戻るボタンと中央の見出し、渡さないと mealgo のロゴと小さな見出し（食堂の名前など）。
//   cartCount を渡すと右にカートボタン（/checkout へ）。
export function AppHeader({
  title,
  back,
  cartCount,
}: {
  title: string
  back?: string
  cartCount?: number
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-line/70 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-md items-center gap-2 px-2">
        {back ? (
          <>
            <Link
              to={back}
              aria-label="戻る"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-ink"
            >
              <BackIcon />
            </Link>
            <h1 className="flex-1 truncate text-center text-base font-bold text-ink">{title}</h1>
          </>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2.5 pl-2">
            <MealgoWordmark className="h-6" />
            <span aria-hidden="true" className="h-4 w-px shrink-0 bg-ink-line" />
            <h1 className="truncate text-[13px] font-bold text-ink-sub">{title}</h1>
          </div>
        )}
        {cartCount !== undefined ? (
          <Link
            to="/checkout"
            aria-label={`カート（${cartCount}点）`}
            className="relative flex h-11 w-11 items-center justify-center rounded-lg text-ink"
          >
            <CartIcon />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 animate-pop-in items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold tabular-nums text-white">
                {cartCount}
              </span>
            )}
          </Link>
        ) : (
          <span className="w-11" />
        )}
      </div>
    </header>
  )
}
