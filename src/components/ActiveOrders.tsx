import { Link } from 'react-router-dom'
import { ChevronRightIcon } from '@/components/icons'
import { ReadyOverlay } from '@/components/ReadyOverlay'
import { useCompletionAlert, useMyOrders } from '@/hooks/useOrders'
import { isShownInActiveCard } from '@/lib/orderProgress'
import { DINING_LABEL, STATUS_LABEL } from '@/types/order'

// 「注文中」カード。この端末で今日した注文のうち、進行中・できあがり直後のものを出す。
// 注文番号の画面を閉じても、ここから状況に戻れる。できあがったら全画面でお知らせする。
export function ActiveOrders({ className = '' }: { className?: string }) {
  const mine = useMyOrders()
  const { ready, dismiss } = useCompletionAlert(mine)
  const shown = mine.filter((o) => isShownInActiveCard(o, Date.now()))

  return (
    <>
      {shown.length > 0 && (
        <section aria-label="注文中の商品" className={`space-y-2 ${className}`}>
          {shown.map((o) => {
            const done = o.status === 'completed'
            return (
              <Link
                key={o.id}
                to={`/order/${o.id}`}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-white ${
                  done ? 'bg-success' : 'bg-ink'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs text-white/80">
                    {done ? 'できあがりました' : '注文中'}
                    {o.diningOption && `・${DINING_LABEL[o.diningOption]}`}
                  </span>
                  <span className="mt-0.5 flex items-baseline gap-2">
                    <span className="text-xs">注文番号</span>
                    <span className="text-2xl font-bold leading-none tabular-nums">
                      {o.orderNumber}
                    </span>
                    <span className="text-sm font-bold">
                      {done ? 'カウンターへ' : STATUS_LABEL[o.status]}
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center text-sm font-bold">
                  注文状況
                  <ChevronRightIcon className="h-5 w-5" />
                </span>
              </Link>
            )
          })}
        </section>
      )}
      {ready && <ReadyOverlay order={ready} onClose={dismiss} />}
    </>
  )
}
