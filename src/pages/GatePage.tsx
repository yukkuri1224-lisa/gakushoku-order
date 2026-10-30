import { Navigate, useNavigate } from 'react-router-dom'
import { PasscodeScreen } from '@/components/PasscodeScreen'
import { RequireLogin } from '@/components/RequireLogin'
import { loginMode } from '@/lib/auth'
import { ACCESS_PASSWORD, GATE_KEY, isGateOpen, openGate } from '@/lib/gate'

// 学生の入口。VITE_LOGIN_DOMAIN があれば学校の Google アカウントでログイン、なければ合言葉。
export function GatePage() {
  return loginMode === 'account' ? <AccountGate /> : <PasscodeGate />
}

// ログイン済みの端末は、そのまま最初の画面（ご利用方法の選択）へ
function AccountGate() {
  return (
    <RequireLogin>
      <Navigate to="/start" replace />
    </RequireLogin>
  )
}

function PasscodeGate() {
  const navigate = useNavigate()
  // 合言葉を入れたことがある端末は、そのまま最初の画面（ご利用方法の選択）へ
  if (isGateOpen(GATE_KEY)) return <Navigate to="/start" replace />
  return (
    <PasscodeScreen
      title={
        <>
          LiSA校食堂の<wbr />
          モバイルオーダー
        </>
      }
      description="並ばずに、スマホで注文・お支払い。できあがったらお知らせします。"
      label="合言葉"
      submitLabel="はじめる"
      onSubmit={(pw) => {
        if (!ACCESS_PASSWORD || pw !== ACCESS_PASSWORD) return false
        openGate(GATE_KEY)
        navigate('/start')
        return true
      }}
      footer={{ to: '/staff', label: '食堂スタッフの方はこちら' }}
    />
  )
}
