import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MENU, MENU_CATEGORIES, type MenuItem } from '@/data/menu'
import { AppHeader } from '@/components/AppHeader'
import { PickupBar } from '@/components/PickupBar'
import { MenuRow } from '@/components/MenuRow'
import { ItemSheet } from '@/components/ItemSheet'
import { cartCount, cartTotal, useCartStore } from '@/store/cart'
import { useToast } from '@/store/toast'
import type { OrderItem } from '@/types/order'

export function MenuPage() {
  const items = useCartStore((s) => s.items)
  const add = useCartStore((s) => s.add)
  const showToast = useToast((s) => s.show)
  const [openItem, setOpenItem] = useState<MenuItem | null>(null)

  const total = cartTotal(items)
  const count = cartCount(items)

  // 商品ごとのカート内数量（選択肢違いの行も合算）
  const qtyByItem = useMemo(() => {
    const m = new Map<string, number>()
    for (const i of items) {
      const id = i.menuItemId ?? MENU.find((x) => x.name === i.name)?.id
      if (id) m.set(id, (m.get(id) ?? 0) + i.quantity)
    }
    return m
  }, [items])

  const close = useCallback(() => setOpenItem(null), [])
  const handleAdd = (line: OrderItem) => {
    add(line)
    setOpenItem(null)
    showToast('カートに追加しました')
  }

  return (
    <div className="min-h-full bg-white pb-32">
      <AppHeader title="LiSA校食堂" cartCount={count} />
      <PickupBar />

      <main className="mx-auto max-w-md px-4">
        <h2 className="pb-1 pt-5 text-xl font-bold">メニュー</h2>
        {MENU_CATEGORIES.map((cat) => {
          const list = MENU.filter((m) => m.category === cat)
          if (list.length === 0) return null
          return (
            <section key={cat} className="pt-4">
              <h3 className="border-b border-ink-line pb-2 text-[13px] font-bold text-ink-sub">
                {cat}
              </h3>
              {list.map((item) => (
                <MenuRow
                  key={item.id}
                  item={item}
                  quantity={qtyByItem.get(item.id) ?? 0}
                  onOpen={() => setOpenItem(item)}
                />
              ))}
            </section>
          )
        })}
      </main>

      {count > 0 && (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-ink-line bg-white px-4 pt-3 shadow-sheet">
          <div className="mx-auto max-w-md">
            <Link
              to="/checkout"
              className="flex h-[52px] w-full items-center justify-between rounded-lg bg-ink px-4 text-white active:opacity-90"
            >
              <span className="flex items-center gap-2 font-bold">
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs tabular-nums text-ink">
                  {count}
                </span>
                カートを見る
              </span>
              <span className="font-bold tabular-nums">
                ¥{total.toLocaleString()}
              </span>
            </Link>
          </div>
        </div>
      )}

      {openItem && (
        <ItemSheet
          key={openItem.id}
          item={openItem}
          onClose={close}
          onAdd={handleAdd}
        />
      )}
    </div>
  )
}
