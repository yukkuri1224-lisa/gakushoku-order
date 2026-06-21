import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CartList } from '@/components/CartList'
import { cartCount, cartTotal, useCartStore } from '@/store/cart'
import { getPaymentProvider } from '@/lib/payment'
import { getOrderRepository } from '@/lib/orders'

export function CheckoutPage() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const increment = useCartStore((s) => s.increment)
  const decrement = useCartStore((s) => s.decrement)
  const remove = useCartStore((s) => s.remove)
  const clear = useCartStore((s) => s.clear)

  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = cartTotal(items)
  const count = cartCount(items)

  const handlePay = async () => {
    if (count === 0 || paying) return
    setError(null)
    setPaying(true)
    try {
      // 1) 決済（デモはモック。VITE_PAYMENT_MODE で本番 PayPay に差し替え可能）
      const draft = { items, total }
      const result = await getPaymentProvider().pay(total, draft)
      if (!result.success) {
        setPaying(false)
        return // ユーザーがキャンセル
      }
      // 2) 決済成功 → 注文を作成（Firestore もしくはローカル同期）
      const { id } = await getOrderRepository().createOrder(
        draft,
        result.paymentMethod,
      )
      // 3) カートを空にして注文状態画面へ
      clear()
      navigate(`/order/${id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '決済処理でエラーが発生しました')
      setPaying(false)
    }
  }

  if (count === 0) {
    return (
      <div className="app-bg flex min-h-full flex-col items-center justify-center p-6 text-center">
        <div className="mb-3 text-6xl">🛒</div>
        <p className="mb-5 text-gray-500">カートが空です</p>
        <Link
          to="/menu"
          className="btn-press rounded-full bg-brand px-7 py-3 font-bold text-white shadow-lg"
        >
          メニューを見る
        </Link>
      </div>
    )
  }

  return (
    <div className="app-bg min-h-full pb-32">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-black/5 bg-white/80 px-4 py-3 backdrop-blur">
        <Link
          to="/menu"
          aria-label="戻る"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600"
        >
          ←
        </Link>
        <h1 className="text-lg font-black text-gray-900">お会計</h1>
      </header>

      <main className="mx-auto max-w-md p-4">
        <section className="animate-slide-up rounded-3xl bg-white p-4 shadow-card ring-1 ring-black/5">
          <h2 className="mb-3 font-bold text-gray-700">注文内容</h2>
          <CartList
            items={items}
            onInc={increment}
            onDec={decrement}
            onRemove={remove}
          />
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="font-bold text-gray-600">合計</span>
            <span className="text-3xl font-black text-gray-900">
              ¥{total.toLocaleString()}
            </span>
          </div>
        </section>

        {error && (
          <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-500">
            {error}
          </p>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-black/5 bg-white/90 p-4 backdrop-blur">
        <div className="mx-auto max-w-md">
          <button
            disabled={paying}
            onClick={handlePay}
            className="btn-press flex w-full items-center justify-center gap-2 rounded-full bg-paypay py-4 text-lg font-bold text-white shadow-lg disabled:bg-gray-300"
          >
            {paying ? (
              '処理中…'
            ) : (
              <>
                <span className="font-black italic">PayPay</span>
                で支払う・¥{total.toLocaleString()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
