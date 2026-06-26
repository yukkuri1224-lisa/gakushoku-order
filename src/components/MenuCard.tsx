import type { MenuItem } from '@/data/menu'

export function MenuCard({
  item,
  quantity,
  onAdd,
}: {
  item: MenuItem
  quantity: number
  onAdd: () => void
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-black/5">
      {/* サムネイル */}
      <div className="relative flex h-28 items-center justify-center bg-gray-100">
        {item.image && (
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
        {quantity > 0 && (
          <span className="absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-white/90 px-2 text-sm font-extrabold text-brand shadow">
            {quantity}
          </span>
        )}
      </div>

      {/* 情報 */}
      <div className="p-3">
        {item.tagline && (
          <p className="mb-0.5 text-[11px] font-medium text-brand">
            {item.tagline}
          </p>
        )}
        <p className="truncate font-bold text-gray-800">{item.name}</p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-lg font-extrabold text-gray-900">
            ¥{item.price.toLocaleString()}
          </p>
          <button
            onClick={onAdd}
            aria-label={`${item.name}を追加`}
            className="btn-press flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xl font-bold leading-none text-white shadow-md"
          >
            ＋
          </button>
        </div>
      </div>
    </div>
  )
}
