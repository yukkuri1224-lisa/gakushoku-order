import type { ReactNode } from 'react'
import { RequireGate } from '@/components/RequireGate'
import { LoginScreen } from '@/components/LoginScreen'
import { ProcessingScreen } from '@/components/ProcessingScreen'
import { useLoginState } from '@/hooks/useLogin'
import { LOGIN_DOMAIN, loginMode, signInWithGoogle, type LoginState } from '@/lib/auth'
import { GATE_KEY } from '@/lib/gate'

const STAFF_SIGNED_IN =
  'いまは食堂スタッフのアカウントでログインしています。注文するには、学校のアカウントでログインしてください。'

// 学生の画面の入口チェック。アカウントでのログインなら学校の Google アカウント、そうでなければ合言葉。
export function RequireLogin({ children }: { children: ReactNode }) {
  return loginMode === 'account' ? (
    <StudentAccount>{children}</StudentAccount>
  ) : (
    <RequireGate flag={GATE_KEY} redirectTo="/">
      {children}
    </RequireGate>
  )
}

// アカウントでのログインのときだけ、学校のアカウントを求める（合言葉のデモでは入口チェックなし）。
// 注文の進み具合や、PayPay から戻ってきた画面のように、別のブラウザで開かれることがある画面用。
export function RequireSchoolAccount({
  children,
  notice,
}: {
  children: ReactNode
  notice?: string
}) {
  return loginMode === 'account' ? (
    <StudentAccount notice={notice}>{children}</StudentAccount>
  ) : (
    <>{children}</>
  )
}

/** 学生としてログインしているときだけ中身を動かす（画面を持たない見張り用。合言葉のデモでは常に） */
export function WhenStudent({ children }: { children: ReactNode }) {
  return loginMode === 'account' ? <WhenStudentAccount>{children}</WhenStudentAccount> : <>{children}</>
}

function WhenStudentAccount({ children }: { children: ReactNode }) {
  const login = useLoginState()
  return login.status === 'signedIn' && login.role === 'student' ? <>{children}</> : null
}

function StudentAccount({ children, notice }: { children: ReactNode; notice?: string }) {
  const login = useLoginState()
  return (
    <StudentAccountGate login={login} onSignIn={signInWithGoogle} notice={notice}>
      {children}
    </StudentAccountGate>
  )
}

/**
 * 学生のアカウントでログインしていれば中身を出し、そうでなければその場でログイン画面を出す
 * （入口に戻さないので、ログインしたあとも同じ画面のまま続けられる）。
 */
export function StudentAccountGate({
  login,
  onSignIn,
  notice,
  children,
}: {
  login: LoginState
  onSignIn: () => Promise<void>
  notice?: string
  children: ReactNode
}) {
  if (login.status === 'loading') return <ProcessingScreen title="読み込み中…" description="" />
  if (login.status === 'signedIn' && login.role === 'student') return <>{children}</>
  return (
    <LoginScreen
      domain={LOGIN_DOMAIN}
      onSignIn={onSignIn}
      notice={login.status === 'signedIn' ? STAFF_SIGNED_IN : notice}
    />
  )
}
