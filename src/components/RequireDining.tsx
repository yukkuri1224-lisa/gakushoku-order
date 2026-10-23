import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useDiningStore } from '@/store/dining'

// ご利用方法（店内／お持ち帰り）が未選択なら、選択画面へ戻す。
export function RequireDining({ children }: { children: ReactNode }) {
  const option = useDiningStore((s) => s.option)
  return option ? <>{children}</> : <Navigate to="/start" replace />
}
