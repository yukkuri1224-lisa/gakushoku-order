import { CheckIcon } from '@/components/icons'
import { moveRadioSelection } from '@/lib/radioKeys'
import { DINING_LABEL, type DiningOption } from '@/types/order'

const OPTIONS: readonly DiningOption[] = ['eat_in', 'takeout']

// 注文内容の確認画面の「ご利用方法」。2 列のカードから 1 つ選ぶ。
export function DiningChoice({
  value,
  onChange,
  labelledBy,
}: {
  value: DiningOption | null
  onChange: (option: DiningOption) => void
  labelledBy: string
}) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      onKeyDown={(e) => moveRadioSelection(e, OPTIONS, value, onChange)}
      className="grid grid-cols-2 gap-2"
    >
      {OPTIONS.map((option, i) => {
        const checked = value === option
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked || (value === null && i === 0) ? 0 : -1}
            onClick={() => onChange(option)}
            className={`flex h-14 items-center justify-between gap-2 rounded-lg border px-3 text-left ${
              checked ? 'border-ink ring-1 ring-ink' : 'border-ink-line'
            }`}
          >
            <span className={`min-w-0 flex-1 text-[15px] ${checked ? 'font-bold' : ''}`}>
              {DINING_LABEL[option]}
            </span>
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                checked ? 'bg-ink text-white' : 'border-2 border-ink-line'
              }`}
            >
              {checked && <CheckIcon className="h-3.5 w-3.5" />}
            </span>
          </button>
        )
      })}
    </div>
  )
}
