import type { MenuItem } from '@/data/menu'
import { MenuPrice, MenuThumb } from '@/components/MenuThumb'

// メニュー一覧の1行。行全体が1つのボタン（タップで商品シートを開く）。
// 文字は左・画像は右。画像のない商品も文字の位置がそろう。
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
      className="flex min-h-[88px] w-full items-center gap-4 border-b border-ink-line py-4 text-left active:bg-surface"
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          {quantity > 0 && (
            <>
              <span
                aria-hidden="true"
                className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-ink px-1.5 text-xs font-bold tabular-nums text-white"
              >
                {quantity}
              </span>
              <span className="sr-only">カートに{quantity}点</span>
            </>
          )}
          <span className="text-base font-bold text-ink">{item.name}</span>
        </span>
        {item.description && (
          <span className="mt-0.5 block truncate text-[13px] text-ink-sub">
            {item.description}
          </span>
        )}
        <MenuPrice item={item} className="mt-2 block text-base font-bold text-ink" />
      </span>
      <MenuThumb item={item} className="h-[88px] w-[88px]" />
    </button>
  )
}
