import { STATUS_LABEL, type OrderStatus } from '@/types/order'

const STYLE: Record<OrderStatus, string> = {
  paid: 'bg-blue-50 text-blue-600 ring-blue-200',
  preparing: 'bg-amber-50 text-amber-600 ring-amber-200',
  completed: 'bg-green-50 text-green-600 ring-green-200',
}

const DOT: Record<OrderStatus, string> = {
  paid: 'bg-blue-500',
  preparing: 'bg-amber-500',
  completed: 'bg-green-500',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ring-1 ${STYLE[status]}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${DOT[status]} ${
          status !== 'completed' ? 'animate-pulse' : ''
        }`}
      />
      {STATUS_LABEL[status]}
    </span>
  )
}
