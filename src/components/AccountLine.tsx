import { useNavigate } from 'react-router-dom'
import { useLoginState } from '@/hooks/useLogin'
import { loginMode, signOutGoogle } from '@/lib/auth'

// ログイン中のアカウントとログアウト（Google ログインのときだけ出す）。
export function AccountLine() {
  return loginMode === 'google' ? <GoogleAccountLine /> : null
}

function GoogleAccountLine() {
  const login = useLoginState()
  const navigate = useNavigate()
  if (login.status !== 'signedIn') return null
  return (
    <div className="flex items-center justify-center gap-2 text-[13px] text-ink-sub">
      <span className="min-w-0 truncate">ログイン中：{login.email}</span>
      <button
        type="button"
        onClick={async () => {
          await signOutGoogle()
          navigate('/', { replace: true })
        }}
        className="h-11 shrink-0 px-1 font-bold text-ink underline underline-offset-4"
      >
        ログアウト
      </button>
    </div>
  )
}
