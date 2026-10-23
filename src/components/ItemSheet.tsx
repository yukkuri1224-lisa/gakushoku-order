import { useEffect, useRef, useState } from 'react'
import type { MenuItem } from '@/data/menu'
import {
  buildOrderItem,
  defaultSelection,
  priceLabel,
  unitPrice,
  type Selection,
} from '@/lib/menuOptions'
import { OptionGroupField } from '@/components/OptionGroupField'
import { QuantityStepper } from '@/components/QuantityStepper'
import { CloseIcon } from '@/components/icons'
import type { OrderItem } from '@/types/order'

// 商品詳細（下から開くハーフモーダル）。小さなサムネイルの見出し＋2 列の選択カード＋数量で、
// スクロールせずに 1 画面で選べるようにする。開くたびに選択肢は初期値・数量は 1 から始まる。
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
        <div className="flex justify-center pt-2" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-ink-line" />
        </div>

        <div className="flex shrink-0 items-start gap-3 border-b border-ink-line px-4 pb-4 pt-2">
          <span className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface">
            {item.image && (
              <img src={item.image} alt="" className="h-full w-full object-cover" />
            )}
          </span>
          <div className="min-w-0 flex-1 pt-1">
            <h2 className="text-lg font-bold text-ink">{item.name}</h2>
            {item.description && (
              <p className="mt-0.5 text-[13px] text-ink-sub">{item.description}</p>
            )}
            <p className="mt-1 text-[15px] font-bold tabular-nums">
              {priceLabel(item)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-5">
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
          <div className="mt-5 flex items-center justify-between border-t border-ink-line pt-4">
            <span className="text-[15px] font-bold">数量</span>
            <QuantityStepper value={quantity} onChange={setQuantity} />
          </div>
        </div>

        <div className="pb-safe shrink-0 border-t border-ink-line bg-white px-4 pt-3">
          <button
            type="button"
            onClick={() => onAdd(buildOrderItem(item, selection, quantity))}
            className="h-[52px] w-full rounded-lg bg-ink text-base font-bold text-white active:opacity-90"
          >
            カートに入れる・
            <span className="tabular-nums">¥{amount.toLocaleString()}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
