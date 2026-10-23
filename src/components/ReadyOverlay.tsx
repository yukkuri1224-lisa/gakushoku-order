import { useEffect, useRef } from 'react'
import { CheckIcon } from '@/components/icons'
import { DINING_LABEL, type Order } from '@/types/order'

// できあがりのお知らせ（全画面）。一番大事な知らせなので、見逃さない大きさで出す。
export function ReadyOverlay({
  order,
  onClose,
}: {
  order: Order
  onClose: () => void
}) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    buttonRef.current?.focus()
  }, [])

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="ready-title"
      aria-describedby="ready-desc"
      className="fixed inset-0 z-50 flex animate-fade-in flex-col bg-cream"
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="flex h-20 w-20 animate-pop-in items-center justify-center rounded-full bg-success text-white shadow-card">
          <CheckIcon className="h-8 w-8" />
        </span>
        <h2 id="ready-title" className="mt-5 text-2xl font-bold">
          できあがりました
        </h2>
        <p className="mt-8 text-[13px] font-bold text-ink-sub">注文番号</p>
        <p className="text-[88px] font-bold leading-none tabular-nums text-brand">
          {order.orderNumber}
        </p>
        {order.diningOption && (
          <p className="mt-3 rounded-full bg-white px-3 py-1 text-sm font-bold shadow-card">
            {DINING_LABEL[order.diningOption]}
          </p>
        )}
        <p id="ready-desc" className="mt-8 text-[15px] leading-relaxed">
          カウンターで注文番号をお伝えください。
          <br />
          お待ちしております。
        </p>
      </div>
      <div className="pb-safe mx-auto w-full max-w-md px-4 pt-3">
        <button
          ref={buttonRef}
          type="button"
          onClick={onClose}
          className="h-14 w-full rounded-full bg-brand text-base font-bold text-white shadow-float"
        >
          わかりました
        </button>
      </div>
    </div>
  )
}
