import type { KeyboardEvent } from 'react'

/**
 * radiogroup の矢印キー操作（→↓ で次、←↑ で前）。選択を移し、そのボタンにフォーカスする。
 * 選択中の radio だけを tabIndex=0 にしておく前提（roving tabindex）。
 */
export function moveRadioSelection<T extends string>(
  e: KeyboardEvent<HTMLElement>,
  ids: readonly T[],
  value: T | null,
  onChange: (id: T) => void,
): void {
  const step =
    e.key === 'ArrowRight' || e.key === 'ArrowDown'
      ? 1
      : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
        ? -1
        : 0
  if (step === 0) return
  e.preventDefault()
  const n = ids.length
  const i = value === null ? -1 : ids.indexOf(value)
  const next = i < 0 ? (step > 0 ? 0 : n - 1) : (i + step + n) % n
  onChange(ids[next])
  e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus()
}
