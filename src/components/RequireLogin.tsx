import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { RequireGate } from '@/components/RequireGate'
import { ProcessingScreen } from '@/components/ProcessingScreen'
import { useLoginState } from '@/hooks/useLogin'
import { loginMode } from '@/lib/auth'
import { GATE_KEY } from '@/lib/gate'

// 学生の画面の入口チェック。Google ログインの設定があればログイン済みか、なければ合言葉を入れたか。
export function RequireLogin({ children }: { children: ReactNode }) {
  return loginMode === 'google' ? (
    <RequireGoogleLogin>{children}</RequireGoogleLogin>
  ) : (
    <RequireGate flag={GATE_KEY} redirectTo="/">
      {children}
    </RequireGate>
  )
}

function RequireGoogleLogin({ children }: { children: ReactNode }) {
  const login = useLoginState()
  if (login.status === 'loading') return <ProcessingScreen title="読み込み中…" description="" />
  return login.status === 'signedIn' ? <>{children}</> : <Navigate to="/" replace />
}
