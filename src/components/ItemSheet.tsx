import { useEffect, useRef, useState } from 'react'
import type { MenuItem } from '@/data/menu'
import {
  buildOrderItem,
  defaultSelection,
  missingChoices,
  unitPrice,
  type Selection,
} from '@/lib/menuOptions'
import { MenuPrice } from '@/components/MenuThumb'
import { OptionGroupField } from '@/components/OptionGroupField'
import { QuantityStepper } from '@/components/QuantityStepper'
import { CloseIcon } from '@/components/icons'
import type { OrderItem } from '@/types/order'

// 商品詳細（下から開くハーフモーダル）。上に大きな画像、2 列の選択カード＋数量。
// 開くたびに選択肢は初期値・数量は 1 から始まる。
// 初期値のない選択肢（うどん／そば）を選ぶまで、また売り切れのあいだは、ボタンに理由を出してカートに入れられない。
// 親側で item が変わるたびに key を変えて再マウントする想定。
export function ItemSheet({
  item,
  soldOut = false,
  onClose,
  onAdd,
}: {
  item: MenuItem
  soldOut?: boolean
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
  const missing = missingChoices(item, selection)
  const blockedReason = soldOut
    ? '売り切れです'
    : missing.length > 0
      ? `${missing[0].label}を選んでください`
      : null

  return (
    <div
      className="fixed inset-0 z-40 flex animate-fade-in items-end justify-center bg-black/45"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-md animate-sheet-up flex-col overflow-hidden rounded-t-3xl bg-white shadow-sheet outline-none"
      >
        <div className="relative shrink-0">
          <div className="absolute inset-x-0 top-2 flex justify-center" aria-hidden="true">
            <span className="h-1 w-10 rounded-full bg-ink-line" />
          </div>
          {item.image && (
            <img
              src={item.image}
              alt=""
              className={`mx-auto h-44 w-44 object-contain pt-4 ${soldOut ? 'opacity-40 grayscale' : ''}`}
            />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-cream text-ink"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <div className={item.image ? 'pt-1' : 'pt-12'}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-ink">{item.name}</h2>
              {item.badge && (
                <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold leading-none text-brand-dark">
                  {item.badge}
                </span>
              )}
            </div>
            {item.description && (
              <p className="mt-1 text-sm text-ink-sub">{item.description}</p>
            )}
            <MenuPrice item={item} className="mt-2 block text-lg font-bold text-brand" />
          </div>

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
          {blockedReason ? (
            <button
              type="button"
              disabled
              className="h-14 w-full cursor-not-allowed rounded-full bg-surface text-base font-bold text-ink-sub"
            >
              {blockedReason}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onAdd(buildOrderItem(item, selection, quantity))}
              className="h-14 w-full rounded-full bg-brand text-base font-bold text-white shadow-float active:opacity-90"
            >
              カートに入れる・
              <span className="tabular-nums">¥{amount.toLocaleString()}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
