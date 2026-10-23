import { MENU } from '@/data/menu'
import { itemKey } from '@/lib/menuOptions'
import { MenuThumb } from '@/components/MenuThumb'
import { QuantityStepper } from '@/components/QuantityStepper'
import { OptionTags } from '@/components/OptionTags'
import type { OrderItem } from '@/types/order'

// 注文確認画面のカートの行一覧。数量を 0 にするか「削除」で行を消す。
// 今日売り切れになった商品には「売り切れ」を出す（支払いボタンは CheckoutPage 側で止める）。
export function CartList({
  items,
  soldOutIds,
  onInc,
  onDec,
  onRemove,
}: {
  items: OrderItem[]
  soldOutIds: Set<string>
  onInc: (key: string) => void
  onDec: (key: string) => void
  onRemove: (key: string) => void
}) {
  return (
    <ul className="border-t border-ink-line">
      {items.map((i) => {
        const key = itemKey(i)
        const menuItem = MENU.find(
          (m) => m.id === i.menuItemId || m.name === i.name,
        )
        const soldOut = menuItem !== undefined && soldOutIds.has(menuItem.id)
        return (
          <li key={key} className="flex gap-3 border-b border-ink-line py-4">
            <MenuThumb item={menuItem} className={`h-16 w-16 ${soldOut ? 'opacity-40 grayscale' : ''}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold">{i.name}</p>
                <p className="shrink-0 font-bold tabular-nums">
                  ¥{(i.price * i.quantity).toLocaleString()}
                </p>
              </div>
              {soldOut && (
                <p className="mt-1 inline-block rounded-full bg-danger px-2.5 py-0.5 text-xs font-bold text-white">
                  売り切れ
                </p>
              )}
              <div className="mt-1">
                <OptionTags item={i} />
              </div>
              <p className="mt-0.5 text-[13px] tabular-nums text-ink-faint">
                1点 ¥{i.price.toLocaleString()}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <QuantityStepper
                  value={i.quantity}
                  min={0}
                  onChange={(next) =>
                    next > i.quantity ? onInc(key) : onDec(key)
                  }
                />
                <button
                  type="button"
                  onClick={() => onRemove(key)}
                  className="h-11 px-2 text-sm text-ink-sub underline underline-offset-4"
                >
                  削除
                </button>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
