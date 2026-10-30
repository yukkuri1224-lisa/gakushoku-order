import { useState, type FormEvent } from 'react'
import { EntranceScreen } from '@/components/EntranceScreen'
import { LoginError, type LoginErrorCode } from '@/lib/auth'

const MESSAGES: Partial<Record<LoginErrorCode, string>> = {
  'wrong-password': 'メールアドレスかパスワードが違います。',
  'not-staff': 'このアカウントでは厨房ボードを使えません。食堂の責任者にお問い合わせください。',
  'too-many': '何度も間違えたため、しばらくログインできません。時間をおいてお試しください。',
  disabled: 'このアカウントは止められています。食堂の責任者にお問い合わせください。',
  network: 'インターネットにつながっているか確かめて、もう一度お試しください。',
  'not-configured': 'ログインの準備がまだできていません。食堂の責任者にお知らせください。',
}

// スタッフの入口（Firebase に登録したメールアドレスとパスワード）。
// パスワードは画面やページの中には入らず、確かめるのは Firebase。名簿（staffMembers）にある人だけが入れる。
export function StaffLoginScreen({
  onSignIn,
  notice,
}: {
  onSignIn: (email: string, password: string) => Promise<void>
  notice?: string
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    if (!email.trim() || !password) {
      setError('メールアドレスとパスワードを入れてください。')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSignIn(email.trim(), password)
    } catch (err) {
      const code = err instanceof LoginError ? err.code : 'unknown'
      setError(MESSAGES[code] ?? 'ログインできませんでした。時間をおいて、もう一度お試しください。')
      setPassword('')
    } finally {
      setBusy(false)
    }
  }

  const fieldClass =
    'mt-2 h-14 w-full rounded-xl border border-ink-line bg-white px-4 text-base outline-none transition-colors focus:border-ink'

  return (
    <EntranceScreen
      eyebrow="LiSA校食堂"
      title="厨房ボード"
      description="食堂スタッフ専用の画面です。"
      footer={{ to: '/', label: '注文画面に戻る' }}
    >
      {notice && (
        <p className="mb-4 rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-relaxed text-ink shadow-card">
          {notice}
        </p>
      )}
      <form onSubmit={submit} noValidate>
        <label htmlFor="staff-email" className="text-sm font-bold text-ink">
          メールアドレス
        </label>
        <input
          id="staff-email"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError(null)
          }}
          className={fieldClass}
        />

        <label htmlFor="staff-password" className="mt-4 block text-sm font-bold text-ink">
          パスワード
        </label>
        <div className="relative">
          <input
            id="staff-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            autoCapitalize="none"
            spellCheck={false}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError(null)
            }}
            aria-invalid={error !== null}
            aria-describedby={error ? 'staff-login-error' : undefined}
            className={`${fieldClass} pr-20`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
            aria-controls="staff-password"
            className="absolute right-1 top-2 flex h-14 items-center px-4 text-sm font-bold text-ink-sub"
          >
            {showPassword ? '隠す' : '表示'}
          </button>
        </div>

        {error && (
          <p
            id="staff-login-error"
            role="alert"
            className="mt-3 rounded-2xl bg-danger/10 px-4 py-3 text-sm font-bold text-danger"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="mt-5 h-14 w-full rounded-full bg-brand text-base font-bold text-white active:opacity-90 disabled:opacity-60"
        >
          {busy ? 'ログインしています…' : 'ログイン'}
        </button>
      </form>
      <p className="mt-6 text-xs leading-relaxed text-ink-sub">
        アカウントは食堂の責任者が用意します。パスワードはほかの人に教えず、共用の端末では使い終わったらログアウトしてください。
      </p>
    </EntranceScreen>
  )
}
