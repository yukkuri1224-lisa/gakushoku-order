import { useEffect, useRef, useState } from 'react'
import type { MenuItem } from '@/data/menu'
import {
  buildOrderItem,
  defaultSelection,
  unitPrice,
  type Selection,
} from '@/lib/menuOptions'
import { OptionGroupField } from '@/components/OptionGroupField'
import { QuantityStepper } from '@/components/QuantityStepper'
import { CloseIcon } from '@/components/icons'
import type { OrderItem } from '@/types/order'

// 商品詳細（下から開くシート）。開くたびに選択肢は初期値・数量は 1 から始まる。
// 親側で item が変わるたびに key を変えて再マウントする想定。
export function ItemSheet({
  item,
  onClose,
  onAdd,
}: {
  item: MenuItem
  onClose: () => void
  onAdd: (line: OrderItem) => void
}) {
  const [selection, setSelection] = useState<Selection>(() =>
    defaultSelection(item),
  )
  const [quantity, setQuantity] = useState(1)
  const dialogRef = useRef<HTMLDivElement>(null)

  // 開いている間は背面のスクロールを止め、Esc で閉じる
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const amount = unitPrice(item, selection) * quantity

  return (
    <div
      className="fixed inset-0 z-40 flex animate-fade-in items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-md animate-sheet-up flex-col overflow-hidden rounded-t-xl bg-white shadow-sheet outline-none"
      >
        <div className="relative shrink-0">
          {item.image && (
            <img
              src={item.image}
              alt=""
              className="aspect-[4/3] w-full bg-surface object-cover"
            />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-ink"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
          <h2 className="text-xl font-bold text-ink">{item.name}</h2>
          {item.description && (
            <p className="mt-1 text-[13px] text-ink-sub">{item.description}</p>
          )}
          <p className="mt-2 text-base font-bold tabular-nums">
            ¥{item.price.toLocaleString()}
          </p>

          {(item.optionGroups ?? []).map((g) => (
            <OptionGroupField
              key={g.id}
              group={g}
              value={selection[g.id]}
              onChange={(choiceId) =>
                setSelection((s) => ({ ...s, [g.id]: choiceId }))
              }
            />
          ))}
        </div>

        <div className="pb-safe flex shrink-0 items-center gap-3 border-t border-ink-line bg-white px-4 pt-3">
          <QuantityStepper value={quantity} onChange={setQuantity} />
          <button
            type="button"
            onClick={() => onAdd(buildOrderItem(item, selection, quantity))}
            className="h-[52px] flex-1 rounded-lg bg-ink text-base font-bold text-white active:opacity-90"
          >
            カートに追加する・
            <span className="tabular-nums">¥{amount.toLocaleString()}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
