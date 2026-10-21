import { useId } from 'react'
import type { OptionGroup } from '@/data/menu'
import { CheckIcon } from '@/components/icons'

// 選択肢グループ（1つ選ぶ）。radiogroup / radio として読み上げられる。
export function OptionGroupField({
  group,
  value,
  onChange,
}: {
  group: OptionGroup
  value: string
  onChange: (choiceId: string) => void
}) {
  const labelId = useId()
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between pb-2">
        <h3 id={labelId} className="text-[15px] font-bold text-ink">
          {group.label}
        </h3>
        {group.required && (
          <span className="rounded bg-accent-bg px-2 py-0.5 text-xs font-bold text-accent-fg">
            必須
          </span>
        )}
      </div>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="border-t border-ink-line"
      >
        {group.choices.map((c) => {
          const checked = c.id === value
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onChange(c.id)}
              className="flex h-14 w-full items-center gap-3 border-b border-ink-line text-left"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  checked ? 'bg-ink text-white' : 'border-2 border-ink-line'
                }`}
              >
                {checked && <CheckIcon className="h-4 w-4" />}
              </span>
              <span className={`flex-1 text-[15px] ${checked ? 'font-bold' : ''}`}>
                {c.label}
              </span>
              {c.priceDelta > 0 && (
                <span className="text-sm tabular-nums text-ink-sub">
                  +¥{c.priceDelta.toLocaleString()}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
