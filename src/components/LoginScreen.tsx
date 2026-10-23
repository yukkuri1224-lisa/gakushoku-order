import { useState } from 'react'
import { EntranceScreen } from '@/components/EntranceScreen'
import { GoogleLogo } from '@/components/icons'
import { LoginError, type LoginErrorCode } from '@/lib/auth'

// 学生の入口（学校の Google アカウントでログイン）。指定ドメインのアカウントだけが入れる。
export function LoginScreen({
  domain,
  onSignIn,
}: {
  domain: string
  onSignIn: () => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<Exclude<LoginErrorCode, 'cancelled'> | null>(null)

  const messages: Record<Exclude<LoginErrorCode, 'cancelled'>, string> = {
    'wrong-domain': `@${domain} のアカウントでログインしてください。ほかのアカウントでは使えません。`,
    'not-configured': 'ログインの準備がまだできていません。食堂の担当者にお知らせください。',
    unknown: 'ログインできませんでした。時間をおいて、もう一度お試しください。',
  }

  const signIn = async () => {
    setBusy(true)
    setError(null)
    try {
      await onSignIn()
    } catch (e) {
      const code = e instanceof LoginError ? e.code : 'unknown'
      if (code !== 'cancelled') setError(code)
    } finally {
      setBusy(false)
    }
  }

  return (
    <EntranceScreen
      eyebrow="LiSA校食堂"
      title="学食モバイルオーダー"
      description="並ばずに、スマホで注文・お支払い。できあがったらお知らせします。"
      footer={{ to: '/staff', label: '食堂スタッフの方はこちら' }}
    >
      <button
        type="button"
        onClick={signIn}
        disabled={busy}
        className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-ink-line bg-white text-base font-bold text-ink shadow-card disabled:opacity-60"
      >
        <GoogleLogo />
        {busy ? 'ログインしています…' : 'Google でログイン'}
      </button>
      <p className="mt-3 text-center text-[13px] text-ink-sub">
        学校のアカウントで入れます
        <span className="block font-bold text-ink">@{domain}</span>
      </p>
      {error && (
        <p role="alert" className="mt-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm font-bold text-danger">
          {messages[error]}
        </p>
      )}
      <p className="mt-6 text-xs leading-relaxed text-ink-sub">
        学校のアカウントでログインできないときは、先生にご相談ください。学校の設定で、ほかのサービスへのログインが止められていることがあります。
      </p>
    </EntranceScreen>
  )
}
