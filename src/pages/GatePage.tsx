import { useNavigate } from 'react-router-dom'
import { PasscodeScreen } from '@/components/PasscodeScreen'
import { ACCESS_PASSWORD, GATE_KEY, openGate } from '@/lib/gate'

export function GatePage() {
  const navigate = useNavigate()
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
        navigate('/menu')
        return true
      }}
      footer={{ to: '/staff', label: '食堂スタッフの方はこちら' }}
    />
  )
}
