import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { isGateOpen } from '@/lib/gate'

// 指定フラグのゲートを通っていなければ redirectTo へ。
export function RequireGate({
  flag,
  redirectTo,
  children,
}: {
  flag: string
  redirectTo: string
  children: ReactNode
}) {
  return isGateOpen(flag) ? <>{children}</> : <Navigate to={redirectTo} replace />
}
