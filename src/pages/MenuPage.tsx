import { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { HOT_SNACK, MEAL_CATEGORIES, isHotSnack, type MenuItem } from '@/data/menu'
import { useMenu, visibleMenu } from '@/store/menu'
import { AppHeader } from '@/components/AppHeader'
import { MenuCard } from '@/components/MenuCard'
import { ItemSheet } from '@/components/ItemSheet'
import { ActiveOrders } from '@/components/ActiveOrders'
import { ChevronRightIcon, DiningIcon, SearchIcon } from '@/components/icons'
import { useSoldOut } from '@/hooks/useSoldOut'
import { greeting } from '@/lib/greeting'
import { searchMenu } from '@/lib/menuSearch'
import { CONTAINER_FEE, TOP_CONTAINER_FEE, forDining } from '@/lib/takeout'
import { cartCount, cartTotal, useCartStore } from '@/store/cart'
import { useDiningStore } from '@/store/dining'
import { useToast } from '@/store/toast'
import { DINING_LABEL, type OrderItem } from '@/types/order'

const ALL = 'すべて'

// ジャンルの絞り込みボタンに添える小さな画像
const GENRE_IMAGE: Record<string, string> = {
  定食: '/menu/irasutoya/set_meal.jpg',
  麺類: '/menu/illust/ramen.jpg',
  カレー: '/menu/irasutoya/katsu_curry.jpg',
}

// 枠: 食堂メニュー（券売機の料理）とホットスナック
type Frame = 'meal' | 'hotSnack'
const FRAMES: { id: Frame; label: string }[] = [
  { id: 'meal', label: '食堂メニュー' },
  { id: 'hotSnack', label: HOT_SNACK },
]

export function MenuPage() {
  const items = useCartStore((s) => s.items)
  const add = useCartStore((s) => s.add)
  const dining = useDiningStore((s) => s.option)
  const showToast = useToast((s) => s.show)
  const soldOut = useSoldOut()
  const allItems = useMenu()
  const menu = useMemo(() => visibleMenu(allItems), [allItems])
  const [openItem, setOpenItem] = useState<MenuItem | null>(null)
  const [frame, setFrame] = useState<Frame>('meal')
  const [genre, setGenre] = useState(ALL)
  const [query, setQuery] = useState('')
  const chipsRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const total = cartTotal(items)
  const count = cartCount(items)
  const shownCategories =
    frame === 'hotSnack'
      ? [HOT_SNACK]
      : genre === ALL
        ? MEAL_CATEGORIES
        : MEAL_CATEGORIES.filter((c) => c === genre)
  const searching = query.trim().length > 0
  const results = useMemo(() => searchMenu(menu, query), [menu, query])

  // 商品ごとのカート内数量（選択肢違いの行も合算）
  const qtyByItem = useMemo(() => {
    const m = new Map<string, number>()
    for (const i of items) {
      const id = i.menuItemId ?? menu.find((x) => x.name === i.name)?.id
      if (id) m.set(id, (m.get(id) ?? 0) + i.quantity)
    }
    return m
  }, [items, menu])

  const close = useCallback(() => setOpenItem(null), [])

  // 枠・ジャンルを切り替えたとき、一覧の先頭が絞り込みの帯の下に隠れていたら先頭まで戻す
  const scrollToListTop = () => {
    const chips = chipsRef.current
    const list = listRef.current
    if (!chips || !list) return
    const gap = list.getBoundingClientRect().top - chips.getBoundingClientRect().bottom
    if (gap < 0) window.scrollBy({ top: gap })
  }
  const selectGenre = (next: string) => {
    setGenre(next)
    scrollToListTop()
  }
  const selectFrame = (next: Frame) => {
    setFrame(next)
    scrollToListTop()
  }

  const card = (item: MenuItem) => (
    <MenuCard
      key={item.id}
      item={forDining(item, dining)}
      quantity={qtyByItem.get(item.id) ?? 0}
      soldOut={soldOut.has(item.id)}
      onOpen={() => setOpenItem(item)}
    />
  )
  const takeoutNote =
    dining === 'takeout'
      ? `お持ち帰りの料理は、容器代（${CONTAINER_FEE}円）込みの価格です。上の容器（${TOP_CONTAINER_FEE}円）は料理ごとに選べます。`
      : null

  const handleAdd = (line: OrderItem) => {
    add(line)
    setOpenItem(null)
    showToast('カートに追加しました')
  }

  return (
    <div className="min-h-dvh pb-36">
      <AppHeader title="LiSA校食堂" cartCount={count} />

      <main className="mx-auto max-w-md">
        {/* あいさつと、いまのご利用方法 */}
        <section className="px-4 pt-4">
          <div className="rounded-2xl bg-white px-5 py-4 shadow-card">
            <p className="text-[13px] font-bold text-ink-sub">{greeting()}</p>
            <p className="mt-0.5 text-xl font-bold leading-snug">今日は、なにを食べる？</p>
            <Link
              to="/start"
              aria-label={`ご利用方法を変更（いまは${dining ? DINING_LABEL[dining] : '未選択'}）`}
              className="mt-3 inline-flex h-9 items-center gap-1 rounded-full bg-cream pl-3 pr-2 text-[13px] font-bold text-ink"
            >
              {dining && <DiningIcon option={dining} className="h-4 w-4" />}
              {dining ? DINING_LABEL[dining] : 'ご利用方法'}
              <ChevronRightIcon className="h-4 w-4 text-ink-sub" />
            </Link>
          </div>
        </section>

        <ActiveOrders className="px-4 pt-4" />

        <h2 className="px-4 pt-6 text-xl font-bold">メニュー</h2>

        <div className="px-4 pt-3">
          <label className="flex h-12 items-center gap-2 rounded-full bg-white px-4 shadow-card focus-within:ring-2 focus-within:ring-ink">
            <SearchIcon className="h-5 w-5 shrink-0 text-ink-sub" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="メニューを探す（例：からあげ）"
              aria-label="メニューを検索"
              enterKeyHint="search"
              className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-faint"
            />
          </label>
          {takeoutNote && (
            <p className="text-keep mt-3 text-[13px] leading-relaxed text-ink-sub">{takeoutNote}</p>
          )}
        </div>

        {searching ? (
          <section className="px-4 pt-5" aria-live="polite">
            <h3 className="pb-3 text-lg font-bold">
              「{query.trim()}」の検索結果
              <span className="ml-2 text-[13px] font-normal tabular-nums text-ink-sub">
                {results.length}件
              </span>
            </h3>
            {results.length === 0 ? (
              <p className="py-10 text-center text-sm text-ink-sub">
                見つかりませんでした。ひらがなや、ちがう言い方でも探せます。
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">{results.map(card)}</div>
            )}
          </section>
        ) : (
          <>
            {/* 枠（食堂メニュー／ホットスナック）とジャンルの絞り込み。スクロールしてもヘッダーの下に残る */}
            <div ref={chipsRef} className="sticky top-[57px] z-20 bg-cream/95 backdrop-blur">
              <div role="tablist" aria-label="メニューの枠" className="flex gap-1 px-4 pt-3">
                {FRAMES.map((f) => {
                  const active = f.id === frame
                  return (
                    <button
                      key={f.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => selectFrame(f.id)}
                      className={`h-11 flex-1 rounded-full text-[15px] font-bold transition-colors ${
                        active ? 'bg-ink text-white' : 'bg-white text-ink shadow-card'
                      }`}
                    >
                      {f.label}
                    </button>
                  )
                })}
              </div>
              {frame === 'meal' ? (
                <div
                  role="group"
                  aria-label="ジャンル"
                  className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3"
                >
                  {[ALL, ...MEAL_CATEGORIES].map((g) => {
                    const active = g === genre
                    const image = GENRE_IMAGE[g]
                    return (
                      <button
                        key={g}
                        type="button"
                        aria-pressed={active}
                        onClick={() => selectGenre(g)}
                        className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full text-sm font-bold transition-colors ${
                          image ? 'pl-1 pr-4' : 'px-4'
                        } ${active ? 'bg-brand text-white shadow-float' : 'bg-white text-ink shadow-card'}`}
                      >
                        {image && (
                          <img
                            src={image}
                            alt=""
                            className="h-8 w-8 rounded-full bg-white object-contain"
                          />
                        )}
                        {g}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="h-3" />
              )}
            </div>

            <div ref={listRef} className="px-4">
              {shownCategories.map((cat) => {
                const list = menu.filter((m) => m.category === cat)
                if (list.length === 0) return null
                return (
                  <section key={cat} className="pt-4">
                    <h3 className="flex items-baseline gap-2 pb-3 text-lg font-bold">
                      {cat}
                      <span className="text-[13px] font-normal tabular-nums text-ink-sub">
                        {list.length}品
                      </span>
                    </h3>
                    <div className="grid grid-cols-2 gap-3">{list.map(card)}</div>
                  </section>
                )
              })}
            </div>
          </>
        )}
        <div className="px-4">
          <p className="pt-6 text-center text-xs text-ink-sub">画像はイメージです</p>
        </div>
      </main>

      {count > 0 && (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-cream via-cream/90 to-transparent px-4 pt-6">
          <div className="mx-auto max-w-md">
            <Link
              to="/checkout"
              aria-label={`注文へ進む（${count}点・合計 ¥${total.toLocaleString()}）`}
              className="flex h-14 w-full items-center justify-between rounded-full bg-brand pl-2 pr-5 text-white shadow-float active:opacity-90"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 min-w-10 items-center justify-center rounded-full bg-white px-2 text-sm font-bold tabular-nums text-brand">
                  {count}
                </span>
                <span className="text-left leading-tight">
                  <span className="block text-[11px] text-white/80">合計</span>
                  <span className="block text-[17px] font-bold tabular-nums">
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
          key={`${openItem.id}-${dining}`}
          item={forDining(openItem, dining)}
          note={isHotSnack(openItem) ? undefined : (takeoutNote ?? undefined)}
          soldOut={soldOut.has(openItem.id)}
          onClose={close}
          onAdd={handleAdd}
        />
      )}
    </div>
  )
}
