import { useId, type KeyboardEvent } from 'react'
import type { OptionGroup } from '@/data/menu'
import { CheckIcon } from '@/components/icons'

// 選択肢グループ（1つ選ぶ）。2 列のカードで並べ、radiogroup / radio として読み上げられる。
// 矢印キーで選択を移動できる（選択中のカードだけが Tab で止まる）。
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

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0
    if (step === 0) return
    e.preventDefault()
    const n = group.choices.length
    const i = group.choices.findIndex((c) => c.id === value)
    const next = (i + step + n) % n
    onChange(group.choices[next].id)
    e.currentTarget
      .querySelectorAll<HTMLButtonElement>('[role="radio"]')
      [next]?.focus()
  }

  return (
    <section className="mt-5">
      <div className="flex items-center justify-between">
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
        onKeyDown={onKeyDown}
        className="mt-2 grid grid-cols-2 gap-2"
      >
        {group.choices.map((c) => {
          const checked = c.id === value
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              onClick={() => onChange(c.id)}
              className={`flex min-h-14 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left ${
                checked ? 'border-ink ring-1 ring-ink' : 'border-ink-line'
              }`}
            >
              <span className="min-w-0">
                <span className={`block text-[15px] ${checked ? 'font-bold' : ''}`}>
                  {c.label}
                </span>
                {c.priceDelta > 0 && (
                  <span className="block text-xs tabular-nums text-ink-sub">
                    +¥{c.priceDelta.toLocaleString()}
                  </span>
                )}
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
    </section>
  )
}
