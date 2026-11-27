import { useEffect, useRef } from 'react'
import { CheckIcon, CloseIcon } from '@/components/icons'

// 支払いの前の注意。PayPay で支払ったあと mealgo に戻らないと注文が登録されないので、
// 支払いのページを開く前に、絵で「支払い → mealgo を開く」を伝える。
export function PayNoticeDialog({
  onConfirm,
  onClose,
}: {
  onConfirm: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/45 p-3 sm:items-center" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="pay-notice-title"
        aria-describedby="pay-notice-desc"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm animate-sheet-up rounded-3xl bg-white p-5 shadow-sheet outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-cream"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <h2 id="pay-notice-title" className="text-keep flex items-start gap-2 pr-10 text-xl font-bold leading-snug">
          <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-danger text-sm text-white">
            !
          </span>
          <span>
            決済しただけでは
            <wbr />
            注文は完了しません
          </span>
        </h2>
        <p
          id="pay-notice-desc"
          className="text-keep mt-4 border-2 border-danger px-3 py-2.5 text-[15px] font-bold leading-relaxed text-danger"
        >
          注文を完了するには、
          <wbr />
          PayPayで支払ったあと、
          <wbr />
          必ずmealgoを開いてください。
        </p>

        {/* 支払い → mealgo を開く */}
        <div aria-hidden="true" className="mt-5 flex items-center justify-center gap-3">
          <Phone>
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-ink-sub text-3xl font-bold text-white">
              ¥
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-bright text-white ring-2 ring-white">
                <CheckIcon className="h-4 w-4" />
              </span>
            </span>
          </Phone>
          <span className="h-0 w-0 border-y-[10px] border-l-[14px] border-y-transparent border-l-danger" />
          <Phone>
            <span className="flex gap-2 self-start p-2.5">
              <span className="relative h-8 w-8 shrink-0">
                <img src="/brand/mealgo-icon.png" alt="" className="h-8 w-8 rounded-lg object-cover shadow-card" />
                <span className="absolute -inset-1.5 rounded-full border-[3px] border-danger" />
              </span>
              <span className="h-8 w-8 shrink-0 rounded-lg bg-ink-line" />
            </span>
          </Phone>
        </div>
        <p className="text-keep mt-3 text-center text-xs leading-relaxed text-ink-sub">
          支払いが終わったら「戻る」を押すか、ホーム画面の mealgo を開くと、注文番号が出ます。
        </p>

        <button
          type="button"
          onClick={onConfirm}
          className="mt-5 h-14 w-full rounded-xl bg-brand text-[15px] font-bold text-white shadow-float"
        >
          注意事項を理解し、PayPay を開く
        </button>
      </div>
    </div>
  )
}

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-32 w-[6.5rem] items-center justify-center rounded-[1.25rem] border-[5px] border-ink bg-surface">
      {children}
    </span>
  )
}
