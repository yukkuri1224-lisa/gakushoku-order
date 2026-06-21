import type { OrderItem } from '@/types/order'

export function CartList({
  items,
  onInc,
  onDec,
  onRemove,
}: {
  items: OrderItem[]
  onInc: (name: string) => void
  onDec: (name: string) => void
  onRemove: (name: string) => void
}) {
  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-gray-400">カートは空です 🛒</p>
    )
  }
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li
          key={i.name}
          className="flex items-center justify-between gap-2 rounded-2xl bg-gray-50 p-3"
        >
          <div className="min-w-0">
            <p className="truncate font-bold text-gray-800">{i.name}</p>
            <p className="text-sm text-gray-500">
              ¥{i.price.toLocaleString()} ×{' '}
              <span className="font-semibold text-gray-700">{i.quantity}</span>{' '}
              ={' '}
              <span className="font-bold text-gray-900">
                ¥{(i.price * i.quantity).toLocaleString()}
              </span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => onDec(i.name)}
              aria-label="減らす"
              className="btn-press flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg leading-none text-gray-600 shadow ring-1 ring-black/5"
            >
              −
            </button>
            <span className="w-6 text-center font-extrabold text-gray-800">
              {i.quantity}
            </span>
            <button
              onClick={() => onInc(i.name)}
              aria-label="増やす"
              className="btn-press flex h-8 w-8 items-center justify-center rounded-full bg-brand text-lg leading-none text-white shadow"
            >
              ＋
            </button>
            <button
              onClick={() => onRemove(i.name)}
              aria-label="削除"
              className="ml-1 text-gray-300 transition hover:text-red-500"
            >
              ✕
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
