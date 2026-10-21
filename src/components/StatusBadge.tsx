import { STATUS_LABEL, type OrderStatus } from '@/types/order'

const STYLE: Record<OrderStatus, string> = {
  paid: 'border border-ink-line text-ink',
  preparing: 'bg-accent-bg text-accent-fg',
  completed: 'bg-success/10 text-success',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-1 text-xs font-bold ${STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
