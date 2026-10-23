import type { OrderItem } from '@/types/order'

// 選んだ内容（大盛り・福神漬けなし など）をタグで並べる。旧データ（選択肢なし）は何も出さない。
export function OptionTags({ item }: { item: OrderItem }) {
  const options = item.options ?? []
  if (options.length === 0) return null
  return (
    <ul aria-label="選んだ内容" className="flex flex-wrap gap-1">
      {options.map((o) => (
        <li
          key={o.groupId}
          className="rounded-full border border-ink-line px-2 py-0.5 text-xs text-ink-sub"
        >
          {o.summaryLabel ?? o.choiceLabel}
        </li>
      ))}
    </ul>
  )
}
