import { useCallback, useEffect, useState } from 'react'
import { getOrderRepository } from '@/lib/orders'
import {
  currentPeriod,
  periodRange,
  salesCsvByDay,
  salesCsvByItem,
  salesReport,
  shiftPeriod,
  type PeriodKind,
  type SalesReport,
} from '@/lib/salesReport'

// 売上集計（スタッフ画面だけ）。1 日か 1 か月を選んで、売上の合計・日ごと・メニューごとを出し、CSV で保存できる。
// 金額は注文の合計（税込・選択肢と容器代を含む）。

const yen = (n: number) => `¥${n.toLocaleString()}`

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function SalesPanel() {
  const [kind, setKind] = useState<PeriodKind>('day')
  const [value, setValue] = useState(() => currentPeriod('day'))
  const [report, setReport] = useState<SalesReport | null>(null)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setError(false)
    setReport(null)
    try {
      const { start, end } = periodRange(kind, value)
      const orders = await getOrderRepository().listOrdersSince(start, end)
      setReport(salesReport(orders, start, end))
    } catch (e) {
      console.warn(e)
      setError(true)
    }
  }, [kind, value])
  useEffect(() => {
    void load()
  }, [load])

  const switchKind = (next: PeriodKind) => {
    setKind(next)
    setValue(currentPeriod(next))
  }
  const label =
    kind === 'day'
      ? value.replace(/^(\d+)-0?(\d+)-0?(\d+)$/, '$1年$2月$3日')
      : value.replace(/^(\d+)-0?(\d+)$/, '$1年$2月')

  return (
    <section aria-label="売上集計" className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5">
          {(['day', 'month'] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={k === kind}
              onClick={() => switchKind(k)}
              className={`h-10 rounded-full px-4 text-sm font-bold ${
                k === kind ? 'bg-ink text-white' : 'bg-white text-ink shadow-card'
              }`}
            >
              {k === 'day' ? '日' : '月'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={kind === 'day' ? '前の日' : '前の月'}
            onClick={() => setValue((v) => shiftPeriod(kind, v, -1))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg shadow-card"
          >
            ‹
          </button>
          <input
            type={kind === 'day' ? 'date' : 'month'}
            aria-label={kind === 'day' ? '集計する日' : '集計する月'}
            value={value}
            onChange={(e) => e.target.value && setValue(e.target.value)}
            className="h-10 rounded-full border border-ink-line bg-white px-3 text-sm font-bold tabular-nums"
          />
          <button
            type="button"
            aria-label={kind === 'day' ? '次の日' : '次の月'}
            onClick={() => setValue((v) => shiftPeriod(kind, v, 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg shadow-card"
          >
            ›
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-2xl bg-white p-6 text-center text-sm text-danger shadow-card">
          読み込めませんでした。通信状態を確かめて、もう一度選び直してください。
        </p>
      ) : !report ? (
        <p className="py-16 text-center text-sm text-ink-sub">読み込み中…</p>
      ) : (
        <>
          <h3 className="text-[15px] font-bold">{label}の売上</h3>
          <div className="grid grid-cols-3 gap-2">
            <Kpi label="売上" value={yen(report.sales)} />
            <Kpi label="注文数" value={`${report.orders}件`} />
            <Kpi label="販売数" value={`${report.quantity}点`} />
          </div>
          <p className="text-[13px] leading-relaxed text-ink-sub">
            1件あたり {yen(report.average)}・店内 {yen(report.diningSales.eatIn)}・持ち帰り{' '}
            {yen(report.diningSales.takeout)}（うち容器代 {yen(report.containerFees)}）
          </p>

          {kind === 'month' && (
            <Table
              title="日ごとの売上"
              head={['日付', '注文数', '売上']}
              rows={report.byDay.map((d) => [
                d.date.slice(5).replace('-', '/'),
                `${d.orders}件`,
                yen(d.sales),
              ])}
              csv={() => download(`mealgo-sales-daily-${value}.csv`, salesCsvByDay(report))}
            />
          )}

          {report.byItem.length === 0 ? (
            <p className="rounded-2xl bg-white p-8 text-center text-sm text-ink-sub shadow-card">
              この期間の注文はありません
            </p>
          ) : (
            <Table
              title="メニューごとの売上"
              head={['メニュー', '数量', '売上']}
              rows={report.byItem.map((i) => [i.name, `${i.quantity}点`, yen(i.sales)])}
              csv={() => download(`mealgo-sales-items-${value}.csv`, salesCsvByItem(report))}
            />
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

function Table({
  title,
  head,
  rows,
  csv,
}: {
  title: string
  head: string[]
  rows: string[][]
  csv: () => void
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[15px] font-bold">{title}</h3>
        <button
          type="button"
          onClick={csv}
          className="h-9 shrink-0 rounded-full border border-ink-line px-3 text-xs font-bold"
        >
          CSV で保存
        </button>
      </div>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="border-b border-ink-line text-xs text-ink-sub">
            {head.map((h, i) => (
              <th key={h} className={`py-2 font-bold ${i === 0 ? 'text-left' : 'text-right'}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-b border-ink-line/60 last:border-0">
              {r.map((c, i) => (
                <td key={i} className={`py-2 tabular-nums ${i === 0 ? 'text-left font-bold' : 'text-right'}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
