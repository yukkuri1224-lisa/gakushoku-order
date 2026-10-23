import type { MenuItem } from '@/data/menu'
import { priceLabel } from '@/lib/menuOptions'

// 商品の画像（一覧・商品シート・カートで共通）。画像のない商品は何も出さない
// （空の四角や仮のアイコンを並べず、文字だけの行にする）。
export function MenuThumb({
  item,
  className,
}: {
  item?: MenuItem
  className: string // 大きさ（h-◯ w-◯）
}) {
  if (!item?.image) return null
  return (
    <span
      className={`shrink-0 overflow-hidden rounded-lg border border-ink-line bg-white ${className}`}
    >
      <img src={item.image} alt="" className="h-full w-full object-cover" loading="lazy" />
    </span>
  )
}

/** 価格（単位のある商品は「¥180 / 1こ」） */
export function MenuPrice({ item, className }: { item: MenuItem; className: string }) {
  return (
    <span className={`tabular-nums ${className}`}>
      {priceLabel(item)}
      {item.unit && (
        <span className="ml-1 text-[13px] font-normal text-ink-sub">/ {item.unit}</span>
      )}
    </span>
  )
}
