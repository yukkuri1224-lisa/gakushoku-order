import { useCallback, useEffect, useState } from 'react'
import { getOrderRepository } from '@/lib/orders'
import { RANGE_LABEL, rangeStart, usageStats, type UsageRange } from '@/lib/usageStats'
import type { Order } from '@/types/order'

// 利用状況（スタッフ画面だけ）。注文のデータから、期間ごとの注文数・売上・混む時間・人気メニューを出す。
// グラフは 1 系列の棒（ブランドの色）。棒にふれる・フォーカスすると値が出る。読み上げ用に表も持つ。
// 店内と持ち帰りの割合は、厨房の色分けに合わせて 店内=ブランド、持ち帰り=青（色だけに頼らず文字でも出す）。

const RANGES: UsageRange[] = ['today', 'week', 'month']
const EAT_IN_COLOR = '#B35500'
const TAKEOUT_COLOR = '#2a78d6'

export function UsagePanel() {
  const [range, setRange] = useState<UsageRange>('today')
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [error, setError] = useState(false)

  // 30日分を読んでおけば、期間を切り替えても読み直さずに済む
  const load = useCallback(async () => {
    setError(false)
    try {
      setOrders(await getOrderRepository().listOrdersSince(rangeStart('month', new Date())))
    } catch {
      setError(true)
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  const s = orders ? usageStats(orders, range, new Date()) : null

  return (
    <section aria-label="利用状況" className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={r === range}
              onClick={() => setRange(r)}
              className={`h-10 rounded-full px-4 text-sm font-bold ${
                r === range ? 'bg-ink text-white' : 'bg-white text-ink shadow-card'
              }`}
            >
              {RANGE_LABEL[r]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="h-10 shrink-0 px-2 text-sm font-bold text-ink-sub underline underline-offset-4"
        >
          更新
        </button>
      </div>

      {error ? (
        <p role="alert" className="rounded-2xl bg-white p-6 text-center text-sm text-danger shadow-card">
          読み込めませんでした。「更新」を押してください。
        </p>
      ) : !s ? (
        <p className="py-16 text-center text-sm text-ink-sub">読み込み中…</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Kpi label="注文数" value={`${s.orders}件`} />
            <Kpi label="売上" value={`¥${s.sales.toLocaleString()}`} />
            <Kpi label="1件あたり" value={`¥${s.average.toLocaleString()}`} />
          </div>
          <p className="text-[13px] text-ink-sub">
            うち予約 {s.reservations}件・先生 {s.teachers}件
          </p>

          {s.orders === 0 ? (
            <p className="rounded-2xl bg-white p-8 text-center text-sm text-ink-sub shadow-card">
              この期間の注文はまだありません
            </p>
          ) : (
            <>
              <Card title="時間帯ごとの注文数">
                <Bars
                  data={s.byHour.map((h) => ({ label: `${h.hour}`, full: `${h.hour}時台`, value: h.count }))}
                  labelEvery={1}
                  unit="件"
                />
              </Card>

              {range !== 'today' && (
                <Card title="日ごとの注文数">
                  <Bars
                    data={s.byDay.map((d) => ({ label: d.label, full: d.label, value: d.count }))}
                    labelEvery={range === 'week' ? 1 : 5}
                    unit="件"
                  />
                </Card>
              )}

              <Card title="店内と持ち帰り">
                <DiningShare eatIn={s.dining.eatIn} takeout={s.dining.takeout} />
              </Card>

              <Card title="人気メニュー">
                <Ranking items={s.ranking} />
              </Card>
            </>
          )}
        </>
      )}
    </section>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white px-3 py-3 shadow-card">
      <p className="text-xs font-bold text-ink-sub">{label}</p>
      <p className="mt-1 truncate text-lg font-bold tabular-nums sm:text-xl">{value}</p>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <h3 className="text-[15px] font-bold">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  )
}

/** 縦棒グラフ（1 系列）。いちばん高い棒にだけ値を添え、ほかはふれる・フォーカスで出す */
function Bars({
  data,
  labelEvery,
  unit,
}: {
  data: { label: string; full: string; value: number }[]
  labelEvery: number
  unit: string
}) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const peak = data.findIndex((d) => d.value === max)
  return (
    <>
      {/* 上の余白は、いちばん高い棒の値とふれたときの吹き出しの置き場 */}
      <div className="mt-7 flex h-36 items-end gap-0.5 border-b border-ink-line" aria-hidden="true">
        {data.map((d, i) => (
          <div
            key={d.label}
            tabIndex={0}
            className="group relative flex h-full min-w-0 flex-1 items-end outline-none"
          >
            <div
              className="w-full rounded-t-[4px] bg-brand"
              style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 2 : 0 }}
            />
            {i === peak && d.value > 0 && (
              <span className="absolute inset-x-0 -top-0.5 -translate-y-full text-center text-[11px] font-bold tabular-nums text-ink group-hover:hidden group-focus:hidden">
                {d.value}
              </span>
            )}
            <span className="pointer-events-none absolute left-1/2 top-0 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-bold text-white group-hover:block group-focus:block">
              {d.full} {d.value}
              {unit}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-0.5" aria-hidden="true">
        {data.map((d, i) => (
          <span key={d.label} className="min-w-0 flex-1 text-center text-[10px] tabular-nums text-ink-sub">
            {i % labelEvery === 0 ? d.label : ''}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th>{d.full}</th>
              <td>
                {d.value}
                {unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

/** 店内と持ち帰りの割合（100% の横棒。名前と件数・割合も文字で出す） */
function DiningShare({ eatIn, takeout }: { eatIn: number; takeout: number }) {
  const total = eatIn + takeout
  if (total === 0) return <p className="text-sm text-ink-sub">記録がありません</p>
  const pct = (n: number) => Math.round((n / total) * 100)
  const rows = [
    { label: '店内', value: eatIn, color: EAT_IN_COLOR },
    { label: '持ち帰り', value: takeout, color: TAKEOUT_COLOR },
  ]
  return (
    <>
      <div className="flex h-4 gap-0.5 overflow-hidden rounded-[4px]" aria-hidden="true">
        {rows
          .filter((r) => r.value > 0)
          .map((r) => (
            <div key={r.label} style={{ width: `${pct(r.value)}%`, background: r.color }} />
          ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} aria-hidden="true" />
            <span className="font-bold">{r.label}</span>
            <span className="tabular-nums text-ink-sub">
              {r.value}件（{pct(r.value)}%）
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}

/** 人気メニュー（数量の多い順。横棒は数量の目安） */
function Ranking({ items }: { items: { name: string; quantity: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.quantity))
  return (
    <ol className="space-y-2.5">
      {items.map((i, n) => (
        <li key={i.name} className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-x-2">
          <span className="text-sm font-bold tabular-nums text-ink-sub">{n + 1}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{i.name}</p>
            <div className="mt-1 h-2 rounded-r-[4px] bg-brand" style={{ width: `${(i.quantity / max) * 100}%` }} />
          </div>
          <span className="text-sm font-bold tabular-nums">{i.quantity}点</span>
        </li>
      ))}
    </ol>
  )
}
