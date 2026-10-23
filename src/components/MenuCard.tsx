import type { MenuItem } from '@/data/menu'
import { MenuPrice } from '@/components/MenuThumb'
import { PlusIcon } from '@/components/icons'

// メニューのカード（2 列で並べる）。カード全体が 1 つのボタン（タップで商品シートを開く）。
// 売り切れの商品は画像を薄くして「売り切れ」と重ね、押せないようにする。
export function MenuCard({
  item,
  quantity,
  soldOut,
  onOpen,
}: {
  item: MenuItem
  quantity: number
  soldOut: boolean
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={soldOut}
      className="flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-card transition-transform active:scale-[0.98] disabled:active:scale-100"
    >
      <span className="relative block aspect-square w-full">
        {item.image && (
          <img
            src={item.image}
            alt=""
            loading="lazy"
            className={`h-full w-full object-contain p-1.5 ${soldOut ? 'opacity-35 grayscale' : ''}`}
          />
        )}
        {item.badge && !soldOut && (
          <span className="absolute left-2 top-2 rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold leading-none text-white">
            {item.badge}
          </span>
        )}
        {quantity > 0 && !soldOut && (
          <>
            <span
              aria-hidden="true"
              className="absolute right-2 top-2 flex h-7 min-w-7 animate-pop-in items-center justify-center rounded-full bg-ink px-2 text-xs font-bold tabular-nums text-white"
            >
              {quantity}
            </span>
            <span className="sr-only">カートに{quantity}点</span>
          </>
        )}
        {soldOut && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-ink/85 px-3.5 py-1.5 text-sm font-bold text-white">
              売り切れ
            </span>
          </span>
        )}
      </span>
      <span className="flex flex-1 flex-col px-3 pb-3">
        <span className="line-clamp-2 min-h-[2.6em] text-[15px] font-bold leading-snug text-ink">
          {item.name}
        </span>
        <span className="mt-1.5 flex items-center justify-between gap-1">
          <MenuPrice
            item={item}
            className={`text-[17px] font-bold ${soldOut ? 'text-ink-faint' : 'text-brand'}`}
          />
          {!soldOut && (
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white"
            >
              <PlusIcon className="h-5 w-5" />
            </span>
          )}
        </span>
      </span>
    </button>
  )
}
