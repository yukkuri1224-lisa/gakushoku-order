import { MENU } from '@/data/menu'
import { itemKey } from '@/lib/menuOptions'
import { QuantityStepper } from '@/components/QuantityStepper'
import { OptionTags } from '@/components/OptionTags'
import type { OrderItem } from '@/types/order'

// 注文確認画面のカートの行一覧。数量を 0 にするか「削除」で行を消す。
export function CartList({
  items,
  onInc,
  onDec,
  onRemove,
}: {
  items: OrderItem[]
  onInc: (key: string) => void
  onDec: (key: string) => void
  onRemove: (key: string) => void
}) {
  return (
    <ul className="border-t border-ink-line">
      {items.map((i) => {
        const key = itemKey(i)
        const image = MENU.find(
          (m) => m.id === i.menuItemId || m.name === i.name,
        )?.image
        return (
          <li key={key} className="flex gap-3 border-b border-ink-line py-4">
            <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface">
              {image && (
                <img src={image} alt="" className="h-full w-full object-cover" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold">{i.name}</p>
                <p className="shrink-0 font-bold tabular-nums">
                  ¥{(i.price * i.quantity).toLocaleString()}
                </p>
              </div>
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
