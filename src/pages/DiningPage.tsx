import { Link, useNavigate } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { ActiveOrders } from '@/components/ActiveOrders'
import { AccountLine } from '@/components/AccountLine'
import { InstallGuide } from '@/components/InstallGuide'
import { ChevronRightIcon, DiningIcon } from '@/components/icons'
import { useDiningStore } from '@/store/dining'
import { greeting } from '@/lib/greeting'
import { DINING_LABEL, type DiningOption } from '@/types/order'

const OPTIONS: { option: DiningOption; description: string; note?: string }[] = [
  {
    option: 'eat_in',
    description: '食堂の席で食べられます',
    note: '席を確保してからご注文ください',
  },
  {
    option: 'takeout',
    description: 'お持ち帰り用にご用意します',
  },
]

// ログイン（または合言葉）の直後の最初の画面。ご利用方法（店内／お持ち帰り）を選ぶとメニューへ進む。
export function DiningPage() {
  const navigate = useNavigate()
  const current = useDiningStore((s) => s.option)
  const setOption = useDiningStore((s) => s.setOption)

  const choose = (option: DiningOption) => {
    setOption(option)
    navigate('/menu')
  }

  return (
    <div className="min-h-dvh pb-10">
      <AppHeader title="LiSA校食堂" />
      <main className="mx-auto max-w-md px-4">
        <ActiveOrders className="pt-4" />
        <p className="pt-8 text-sm font-bold text-brand-dark">{greeting()}</p>
        <h1 className="text-keep mt-1 text-2xl font-bold">
          ご利用方法を選んでください
        </h1>
        <p className="mt-2 text-[15px] text-ink-sub">
          注文の確認画面でも変更できます。
        </p>

        <div className="mt-6 space-y-3">
          {OPTIONS.map(({ option, description, note }) => {
            const selected = current === option
            return (
              <button
                key={option}
                type="button"
                onClick={() => choose(option)}
                className={`flex w-full items-center gap-4 rounded-2xl bg-white px-4 py-5 text-left shadow-card transition-transform active:scale-[0.99] ${
                  selected ? 'ring-2 ring-brand' : ''
                }`}
              >
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                  <DiningIcon option={option} className="h-8 w-8" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-lg font-bold">{DINING_LABEL[option]}</span>
                    {selected && (
                      <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white">
                        選択中
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-ink-sub">
                    {description}
                  </span>
                  {note && (
                    <span className="mt-2 inline-block rounded-full bg-accent-bg px-2.5 py-1 text-xs font-bold text-accent-fg">
                      {note}
                    </span>
                  )}
                </span>
                <ChevronRightIcon className="h-5 w-5 shrink-0 text-brand" />
              </button>
            )
          })}
        </div>

        <p className="mt-6 text-[13px] text-ink-sub">
          価格は店内・お持ち帰りとも同じです。
        </p>

        <InstallGuide className="mt-8" />

        <div className="mt-10 text-center">
          <AccountLine />
          <Link
            to="/staff"
            className="inline-flex h-11 items-center text-sm text-ink-sub underline underline-offset-4"
          >
            食堂スタッフの方はこちら
          </Link>
        </div>
      </main>
    </div>
  )
}
