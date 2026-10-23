import { Navigate, useNavigate } from 'react-router-dom'
import { PasscodeScreen } from '@/components/PasscodeScreen'
import { ACCESS_PASSWORD, GATE_KEY, isGateOpen, openGate } from '@/lib/gate'

export function GatePage() {
  const navigate = useNavigate()
  // 合言葉を入れたことがある端末は、そのまま最初の画面（ご利用方法の選択）へ
  if (isGateOpen(GATE_KEY)) return <Navigate to="/start" replace />
  return (
    <PasscodeScreen
      eyebrow="LiSA校"
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
