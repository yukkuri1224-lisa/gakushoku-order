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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="PayPay モック決済"
    >
      <div className="w-full max-w-sm animate-sheet-up rounded-t-3xl bg-white p-6 shadow-float sm:animate-pop-in sm:rounded-3xl">
        <div className="mx-auto mb-1 h-1.5 w-10 rounded-full bg-gray-200 sm:hidden" />

        <div className="mb-5 mt-3 flex flex-col items-center">
          <div className="mb-2 rounded-xl bg-paypay px-5 py-1.5 text-2xl font-black italic tracking-tight text-white shadow">
            PayPay
          </div>
          <p className="text-xs font-medium text-gray-400">
            モック決済（デモ）
          </p>
        </div>

        <div className="rounded-2xl bg-gray-50 py-5 text-center">
          <p className="text-sm text-gray-500">お支払い金額</p>
          <p className="text-4xl font-black text-gray-900">
            ¥{amount.toLocaleString()}
          </p>
        </div>

        <button
          onClick={approve}
          className="btn-press mt-5 w-full rounded-full bg-paypay py-3.5 text-lg font-bold text-white shadow-lg"
        >
          支払う
        </button>
        <button
          onClick={cancel}
          className="mt-1 w-full rounded-full py-3 font-medium text-gray-400"
        >
          キャンセル
        </button>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-gray-400">
          ※これはデモ用のモック画面です。実際の決済は行われません。
        </p>
      </div>
    </div>
  )
}
