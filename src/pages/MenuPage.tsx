import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MENU } from '@/data/menu'
import { MenuCard } from '@/components/MenuCard'
import { CartSheet } from '@/components/CartSheet'
import { cartCount, cartTotal, useCartStore } from '@/store/cart'

export function MenuPage() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const add = useCartStore((s) => s.add)
  const increment = useCartStore((s) => s.increment)
  const decrement = useCartStore((s) => s.decrement)
  const remove = useCartStore((s) => s.remove)

  const [sheetOpen, setSheetOpen] = useState(false)

  const total = cartTotal(items)
  const count = cartCount(items)

  // 各メニューの現在のカート数量（バッジ表示用）
  const qtyByName = useMemo(() => {
    const m = new Map<string, number>()
    for (const i of items) m.set(i.name, i.quantity)
    return m
  }, [items])

  return (
    <div className="app-bg min-h-full pb-28">
      {/* ヒーローヘッダー */}
      <header className="bg-gradient-to-br from-brand to-brand-dark px-5 pb-6 pt-7 text-white shadow-md">
        <div className="mx-auto max-w-md">
          <h1 className="text-sm font-medium text-white/80">ようこそLiSA校食堂へ</h1>
          <h1 className="text-2xl font-black tracking-tight">
            タップしてカートに追加してください
          </h1>
        </div>
      </header>

      {/* メニューグリッド */}
      <main className="mx-auto max-w-md p-4">
        <div className="grid grid-cols-2 gap-3">
          {MENU.map((item, idx) => (
            <div
              key={item.id}
              className="animate-slide-up"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <MenuCard
                item={item}
                quantity={qtyByName.get(item.name) ?? 0}
                onAdd={() => add(item)}
              />
            </div>
          ))}
        </div>
      </main>

      {/* 画面下部の固定バー（タップでカートシート） */}
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 p-4">
          <div className="mx-auto max-w-md">
            <button
              onClick={() => setSheetOpen(true)}
              className="btn-press flex w-full items-center gap-3 rounded-full bg-gray-900 py-3 pl-4 pr-3 text-white shadow-float"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg">
                🛒
              </span>
              <span className="flex-1 text-left">
                <span className="block text-xs text-white/70">
                  カート（{count}点）
                </span>
                <span className="block text-lg font-extrabold leading-tight">
                  ¥{total.toLocaleString()}
                </span>
              </span>
              <span className="rounded-full bg-paypay px-5 py-2 font-bold">
                支払う
              </span>
            </button>
          </div>
        </div>
      )}

      <CartSheet
        open={sheetOpen}
        items={items}
        total={total}
        onClose={() => setSheetOpen(false)}
        onInc={increment}
        onDec={decrement}
        onRemove={remove}
        onCheckout={() => navigate('/checkout')}
      />
    </div>
  )
}
