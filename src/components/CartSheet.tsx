import { CartList } from '@/components/CartList'
import type { OrderItem } from '@/types/order'

// メニュー画面で下から出るカートのボトムシート。
export function CartSheet({
  open,
  items,
  total,
  onClose,
  onInc,
  onDec,
  onRemove,
  onCheckout,
}: {
  open: boolean
  items: OrderItem[]
  total: number
  onClose: () => void
  onInc: (name: string) => void
  onDec: (name: string) => void
  onRemove: (name: string) => void
  onCheckout: () => void
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="カート"
    >
      <div
        className="w-full max-w-md animate-sheet-up rounded-t-3xl bg-white p-5 shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-gray-200" />
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-gray-900">カート 🛒</h2>
          <button onClick={onClose} className="text-sm text-gray-400">
            閉じる
          </button>
        </div>

        <div className="max-h-[45vh] overflow-y-auto">
          <CartList
            items={items}
            onInc={onInc}
            onDec={onDec}
            onRemove={onRemove}
          />
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="font-bold text-gray-600">合計</span>
          <span className="text-2xl font-black text-gray-900">
            ¥{total.toLocaleString()}
          </span>
        </div>
        <button
          disabled={items.length === 0}
          onClick={onCheckout}
          className="btn-press mt-3 w-full rounded-full bg-paypay py-3.5 text-lg font-bold text-white shadow-lg disabled:bg-gray-300"
        >
          支払いに進む
        </button>
      </div>
    </div>
  )
}
