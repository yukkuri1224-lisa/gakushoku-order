import { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MENU, MENU_CATEGORIES, type MenuItem } from '@/data/menu'
import { AppHeader } from '@/components/AppHeader'
import { PickupBar } from '@/components/PickupBar'
import { MenuRow } from '@/components/MenuRow'
import { ItemSheet } from '@/components/ItemSheet'
import { ActiveOrders } from '@/components/ActiveOrders'
import { ChevronRightIcon } from '@/components/icons'
import { cartCount, cartTotal, useCartStore } from '@/store/cart'
import { useToast } from '@/store/toast'
import type { OrderItem } from '@/types/order'

const ALL = 'すべて'

export function MenuPage() {
  const items = useCartStore((s) => s.items)
  const add = useCartStore((s) => s.add)
  const showToast = useToast((s) => s.show)
  const [openItem, setOpenItem] = useState<MenuItem | null>(null)
  const [genre, setGenre] = useState(ALL)
  const chipsRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const total = cartTotal(items)
  const count = cartCount(items)
  const shownCategories =
    genre === ALL ? MENU_CATEGORIES : MENU_CATEGORIES.filter((c) => c === genre)

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

  // ジャンルを切り替えたとき、一覧の先頭が絞り込みの帯の下に隠れていたら先頭まで戻す
  const selectGenre = (next: string) => {
    setGenre(next)
    const chips = chipsRef.current
    const list = listRef.current
    if (!chips || !list) return
    const gap = list.getBoundingClientRect().top - chips.getBoundingClientRect().bottom
    if (gap < 0) window.scrollBy({ top: gap })
  }

  const handleAdd = (line: OrderItem) => {
    add(line)
    setOpenItem(null)
    showToast('カートに追加しました')
  }

  return (
    <div className="min-h-dvh bg-white pb-32">
      <AppHeader title="LiSA校食堂" cartCount={count} />
      <PickupBar />

      <main className="mx-auto max-w-md px-4">
        <ActiveOrders className="pt-4" />
        <h2 className="pt-5 text-xl font-bold">メニュー</h2>

        {/* ジャンルの絞り込み。スクロールしてもヘッダーの下に残る */}
        <div
          ref={chipsRef}
          className="sticky top-[57px] z-20 -mx-4 border-b border-ink-line bg-white"
        >
          <div
            role="group"
            aria-label="ジャンル"
            className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none]"
          >
            {[ALL, ...MENU_CATEGORIES].map((g) => {
              const active = g === genre
              return (
                <button
                  key={g}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectGenre(g)}
                  className={`h-9 min-w-fit flex-1 rounded-full px-3 text-sm ${
                    active
                      ? 'bg-ink font-bold text-white'
                      : 'border border-ink-line text-ink'
                  }`}
                >
                  {g}
                </button>
              )
            })}
          </div>
        </div>

        <div ref={listRef}>
          {shownCategories.map((cat) => {
            const list = MENU.filter((m) => m.category === cat)
            if (list.length === 0) return null
            return (
              <section key={cat} className="pt-4">
                <h3 className="border-b border-ink-line pb-2 text-[13px] font-bold text-ink-sub">
                  {cat}
                  <span className="ml-1.5 font-normal tabular-nums text-ink-faint">
                    {list.length}品
                  </span>
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
        </div>
      </main>

      {count > 0 && (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-ink-line bg-white px-4 pt-3 shadow-sheet">
          <div className="mx-auto max-w-md">
            <Link
              to="/checkout"
              aria-label={`注文へ進む（${count}点・合計 ¥${total.toLocaleString()}）`}
              className="flex h-[52px] w-full items-center justify-between rounded-lg bg-ink px-4 text-white active:opacity-90"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold tabular-nums text-ink">
                  {count}
                </span>
                <span className="text-left leading-tight">
                  <span className="block text-[11px] text-white/70">合計</span>
                  <span className="block font-bold tabular-nums">
                    ¥{total.toLocaleString()}
                  </span>
                </span>
              </span>
              <span className="flex items-center gap-0.5 font-bold">
                注文へ進む
                <ChevronRightIcon className="h-5 w-5" />
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
