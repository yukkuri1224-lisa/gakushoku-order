import { CheckIcon } from '@/components/icons'
import { moveRadioSelection } from '@/lib/radioKeys'

// 2 列のカードから 1 つ選ぶ（ご利用方法と同じ見た目）。選べないカードは薄く出す。
export function RadioCards<T extends string>({
  value,
  options,
  onChange,
  labelledBy,
}: {
  value: T
  options: readonly { id: T; label: string; disabled?: boolean }[]
  onChange: (id: T) => void
  labelledBy: string
}) {
  const enabled = options.filter((o) => !o.disabled).map((o) => o.id)
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      onKeyDown={(e) => moveRadioSelection(e, enabled, value, onChange)}
      className="grid grid-cols-2 gap-2"
    >
      {options.map((o) => {
        const checked = value === o.id
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={checked}
            disabled={o.disabled}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(o.id)}
            className={`flex h-14 items-center justify-between gap-2 rounded-xl border px-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
              checked ? 'border-brand bg-brand-soft ring-1 ring-brand' : 'border-ink-line bg-white'
            }`}
          >
            <span className={`min-w-0 flex-1 text-[15px] ${checked ? 'font-bold' : ''}`}>
              {o.label}
            </span>
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                checked ? 'bg-brand text-white' : 'border-2 border-ink-line'
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
