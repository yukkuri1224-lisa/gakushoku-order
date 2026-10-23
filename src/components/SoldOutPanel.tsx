import { useState } from 'react'
import { MENU, MENU_CATEGORIES } from '@/data/menu'
import { MenuThumb } from '@/components/MenuThumb'
import { getSoldOutRepository } from '@/lib/soldOut'
import { todayKey } from '@/lib/orders/types'

// 厨房ボードの「売り切れ」タブ。商品ごとのボタンで 販売中 ⇄ 売り切れ を切り替える。
// 売り切れはその日だけ（次の日は自動で販売中に戻る）。注文画面にはすぐ反映される。
export function SoldOutPanel({ soldOut }: { soldOut: Set<string> }) {
  const [error, setError] = useState<string | null>(null)

  const toggle = async (id: string) => {
    setError(null)
    try {
      await getSoldOutRepository().setSoldOut(todayKey(), id, !soldOut.has(id))
    } catch (e) {
      console.warn(e)
      setError(
        '保存できませんでした。Firestore のルールに soldOut の許可があるか確認してください（README「売り切れ」）。',
      )
    }
  }

  return (
    <div>
      <p className="text-sm text-ink-sub">
        ボタンを押すと「販売中」と「売り切れ」が切り替わります。売り切れは今日だけで、明日は自動で販売中に戻ります。
      </p>
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-4 py-3 text-sm font-bold text-danger">
          {error}
        </p>
      )}
      {MENU_CATEGORIES.map((cat) => (
        <section key={cat} className="pt-5">
          <h2 className="pb-2 text-base font-bold">{cat}</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {MENU.filter((m) => m.category === cat).map((m) => {
              const out = soldOut.has(m.id)
              return (
                <li
                  key={m.id}
                  className={`flex items-center gap-3 rounded-2xl p-2.5 pr-3 shadow-card ${
                    out ? 'bg-danger/5' : 'bg-white'
                  }`}
                >
                  <MenuThumb item={m} className={`h-12 w-12 ${out ? 'opacity-40 grayscale' : ''}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold">{m.name}</span>
                    <span className="block text-xs tabular-nums text-ink-sub">
                      ¥{m.price.toLocaleString()}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-pressed={out}
                    aria-label={out ? `${m.name}の販売を再開する` : `${m.name}を売り切れにする`}
                    onClick={() => void toggle(m.id)}
                    className={`h-11 w-24 shrink-0 rounded-full text-sm font-bold ${
                      out ? 'bg-danger text-white' : 'border border-ink-line bg-white text-success'
                    }`}
                  >
                    {out ? '売り切れ' : '販売中'}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
