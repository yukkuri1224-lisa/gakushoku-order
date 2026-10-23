import { useId } from 'react'
import type { OptionGroup } from '@/data/menu'
import { CheckIcon } from '@/components/icons'
import { moveRadioSelection } from '@/lib/radioKeys'

// 選択肢グループ（1つ選ぶ）。2 列のカードで並べ、radiogroup / radio として読み上げられる。
// 矢印キーで選択を移動できる（選択中のカードだけが Tab で止まる。未選択なら先頭のカード）。
export function OptionGroupField({
  group,
  value,
  onChange,
}: {
  group: OptionGroup
  value: string | undefined // 初期値のないグループは未選択から始まる
  onChange: (choiceId: string) => void
}) {
  const labelId = useId()

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
        onKeyDown={(e) =>
          moveRadioSelection(
            e,
            group.choices.map((c) => c.id),
            value ?? null,
            onChange,
          )
        }
        className="mt-2 grid grid-cols-2 gap-2"
      >
        {group.choices.map((c, idx) => {
          const checked = c.id === value
          const focusable = checked || (value === undefined && idx === 0)
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={focusable ? 0 : -1}
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
