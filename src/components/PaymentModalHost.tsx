// PayPay 風モック決済モーダル。App 直下に常設し、usePaymentUiStore の状態で表示する。
// MockPaymentProvider.pay() がこのモーダルの承認を待つ。
import { usePaymentUiStore } from '@/store/paymentUi'

export function PaymentModalHost() {
  const open = usePaymentUiStore((s) => s.open)
  const amount = usePaymentUiStore((s) => s.amount)
  const approve = usePaymentUiStore((s) => s.approve)
  const cancel = usePaymentUiStore((s) => s.cancel)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/40">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="PayPay モック決済"
        className="pb-safe w-full max-w-md animate-sheet-up rounded-t-xl bg-white px-4 pt-6 shadow-sheet"
      >
        <div className="flex flex-col items-center">
          <span className="rounded-lg bg-paypay px-4 py-1 text-xl font-bold italic text-white">
            PayPay
          </span>
          <p className="mt-2 text-xs text-ink-sub">モック決済（デモ）</p>
        </div>

        <div className="mt-5 rounded-lg bg-surface py-5 text-center">
          <p className="text-sm text-ink-sub">お支払い金額</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            ¥{amount.toLocaleString()}
          </p>
        </div>

        <button
          type="button"
          onClick={approve}
          className="mt-5 h-[52px] w-full rounded-lg bg-paypay text-base font-bold text-white active:opacity-90"
        >
          支払う
        </button>
        <button
          type="button"
          onClick={cancel}
          className="mt-1 h-11 w-full text-sm text-ink-sub"
        >
          キャンセル
        </button>

        <p className="mt-2 text-center text-[11px] text-ink-faint">
          これはデモ用のモック画面です。実際の決済は行われません。
        </p>
      </div>
    </div>
  )
}
