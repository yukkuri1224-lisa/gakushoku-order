import { useState, type FormEvent } from 'react'
import { EntranceScreen } from '@/components/EntranceScreen'

// 合言葉の入力画面（学生用の入口・スタッフ用で共通）。
// onSubmit が false を返したら「合言葉が違います」を出す。
export function PasscodeScreen({
  eyebrow,
  title,
  description,
  label,
  submitLabel,
  onSubmit,
  footer,
}: {
  eyebrow: string
  title: string
  description: string
  label: string
  submitLabel: string
  onSubmit: (passcode: string) => boolean
  footer: { to: string; label: string }
}) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!onSubmit(pw)) setError(true)
  }

  return (
    <EntranceScreen eyebrow={eyebrow} title={title} description={description} footer={footer}>
      <form onSubmit={submit} noValidate>
        <label htmlFor="passcode" className="text-sm font-bold text-ink">
          {label}
        </label>
        <input
          id="passcode"
          type="password"
          value={pw}
          onChange={(e) => {
            setPw(e.target.value)
            setError(false)
          }}
          autoComplete="off"
          autoFocus
          aria-invalid={error}
          aria-describedby={error ? 'passcode-error' : undefined}
          className={`mt-2 h-14 w-full rounded-2xl border bg-white px-4 text-base outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand ${
            error ? 'border-danger' : 'border-ink-line'
          }`}
        />
        {error && (
          <p id="passcode-error" role="alert" className="mt-2 text-sm text-danger">
            合言葉が違います
          </p>
        )}
        <button
          type="submit"
          className="mt-4 h-14 w-full rounded-full bg-brand text-base font-bold text-white shadow-float active:opacity-90"
        >
          {submitLabel}
        </button>
      </form>
    </EntranceScreen>
  )
}
