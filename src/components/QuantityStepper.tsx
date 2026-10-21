import { MinusIcon, PlusIcon } from '@/components/icons'

// 数量の −／＋。value が min 以下なら − は押せない。
export function QuantityStepper({
  value,
  min = 1,
  max = 20,
  onChange,
}: {
  value: number
  min?: number
  max?: number
  onChange: (next: number) => void
}) {
  const btn =
    'flex h-11 w-11 items-center justify-center rounded-full border border-ink-line text-ink disabled:text-ink-faint disabled:opacity-60'
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="数量を減らす"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className={btn}
      >
        <MinusIcon className="h-5 w-5" />
      </button>
      <span
        aria-live="polite"
        className="w-8 text-center text-base font-bold tabular-nums"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="数量を増やす"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={btn}
      >
        <PlusIcon className="h-5 w-5" />
      </button>
    </div>
  )
}
