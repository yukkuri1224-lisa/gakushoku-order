import type { MenuItem } from '@/data/menu'
import { priceLabel } from '@/lib/menuOptions'

// メニュー一覧の1行。行全体が1つのボタン（タップで商品シートを開く）。
export function MenuRow({
  item,
  quantity,
  onOpen,
}: {
  item: MenuItem
  quantity: number
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-4 border-b border-ink-line py-4 text-left active:bg-surface"
    >
      <span className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-lg bg-surface">
        {item.image && (
          <img
            src={item.image}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
        {quantity > 0 && (
          <span className="absolute left-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-ink px-1.5 text-xs font-bold tabular-nums text-white">
            {quantity}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold text-ink">{item.name}</span>
        {item.description && (
          <span className="mt-0.5 block truncate text-[13px] text-ink-sub">
            {item.description}
          </span>
        )}
        <span className="mt-2 block text-base font-bold tabular-nums text-ink">
          {priceLabel(item)}
        </span>
      </span>
    </button>
  )
}
