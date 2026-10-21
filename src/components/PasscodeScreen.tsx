import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

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
    <div className="flex min-h-dvh flex-col bg-white px-6">
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
        <p className="text-sm font-bold text-ink-sub">{eyebrow}</p>
        <h1 className="text-keep mt-1 text-[28px] font-bold leading-tight text-ink">
          {title}
        </h1>
        <p className="mt-3 text-[15px] text-ink-sub">{description}</p>

        <form onSubmit={submit} className="mt-10" noValidate>
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
            className={`mt-2 h-[52px] w-full rounded-lg border bg-white px-4 text-base outline-none transition-colors focus:border-ink ${
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
            className="mt-4 h-[52px] w-full rounded-lg bg-ink text-base font-bold text-white active:opacity-90"
          >
            {submitLabel}
          </button>
        </form>
      </main>
      <div className="pb-safe mx-auto w-full max-w-sm text-center">
        <Link
          to={footer.to}
          className="inline-flex h-11 items-center text-sm text-ink-sub underline underline-offset-4"
        >
          {footer.label}
        </Link>
      </div>
    </div>
  )
}
