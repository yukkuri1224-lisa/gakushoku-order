import { Navigate, useNavigate } from 'react-router-dom'
import { LoginScreen } from '@/components/LoginScreen'
import { PasscodeScreen } from '@/components/PasscodeScreen'
import { ProcessingScreen } from '@/components/ProcessingScreen'
import { useLoginState } from '@/hooks/useLogin'
import { LOGIN_DOMAIN, loginMode, signInWithGoogle } from '@/lib/auth'
import { ACCESS_PASSWORD, GATE_KEY, isGateOpen, openGate } from '@/lib/gate'

// 学生の入口。VITE_LOGIN_DOMAIN があれば学校の Google アカウントでログイン、なければ合言葉。
export function GatePage() {
  return loginMode === 'google' ? <GoogleGate /> : <PasscodeGate />
}

function GoogleGate() {
  const login = useLoginState()
  if (login.status === 'loading') return <ProcessingScreen title="読み込み中…" description="" />
  // ログイン済みの端末は、そのまま最初の画面（ご利用方法の選択）へ
  if (login.status === 'signedIn') return <Navigate to="/start" replace />
  return <LoginScreen domain={LOGIN_DOMAIN} onSignIn={signInWithGoogle} />
}

function PasscodeGate() {
  const navigate = useNavigate()
  // 合言葉を入れたことがある端末は、そのまま最初の画面（ご利用方法の選択）へ
  if (isGateOpen(GATE_KEY)) return <Navigate to="/start" replace />
  return (
    <PasscodeScreen
      eyebrow="LiSA校食堂"
      title="学食モバイルオーダー"
      description="並ばずに、スマホで注文・お支払い。できあがったらお知らせします。"
      label="合言葉"
      submitLabel="はじめる"
      onSubmit={(pw) => {
        if (pw !== ACCESS_PASSWORD) return false
        openGate(GATE_KEY)
        navigate('/start')
        return true
      }}
      footer={{ to: '/staff', label: '食堂スタッフの方はこちら' }}
    />
  )
}
