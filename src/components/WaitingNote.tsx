import { queueAhead } from '@/lib/orderProgress'
import type { Order } from '@/types/order'

// 待ち状況のひとこと。根拠のない待ち時間は出さず、前の件数で伝える。
// active が null（進行中の注文を読み込み中）の間は、誤った件数を出さないよう何も表示しない。
export function WaitingNote({
  order,
  active,
}: {
  order: Order
  active: Order[] | null
}) {
  if (order.status === 'preparing') {
    return <p className="mt-5 text-center text-sm font-bold">ただいまお作りしています</p>
  }
  if (order.status !== 'paid' || active === null) return null
  const ahead = queueAhead(order, active)
  return (
    <p className="mt-5 text-center text-sm font-bold">
      {ahead > 0 ? (
        <>
          あなたの前に <span className="text-lg tabular-nums">{ahead}</span> 件の注文があります
        </>
      ) : (
        'まもなく調理を始めます'
      )}
    </p>
  )
}
