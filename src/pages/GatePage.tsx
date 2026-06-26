import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ACCESS_PASSWORD, GATE_KEY, openGate } from '@/lib/gate'

export function GatePage() {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)
  const navigate = useNavigate()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (pw === ACCESS_PASSWORD) {
      openGate(GATE_KEY)
      navigate('/menu')
    } else {
      setError(true)
    }
  }

  return (
    <div className="app-bg flex min-h-full flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-block animate-float text-7xl">🍜</div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">
            LiSA校学食モバイルオーダー
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            並ばずにスマホで注文できます
          </p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-3 rounded-3xl bg-white/80 p-5 shadow-card ring-1 ring-black/5 backdrop-blur"
        >
          <label className="block text-sm font-bold text-gray-600">
            モバイルオーダー用パスワードを入力
          </label>
          <input
            type="password"
            value={pw}
            onChange={(e) => {
              setPw(e.target.value)
              setError(false)
            }}
            placeholder="パスワード"
            autoFocus
            className={`w-full rounded-2xl border-2 px-4 py-3 text-center text-lg outline-none transition ${
              error
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 focus:border-brand'
            }`}
          />
          {error && (
            <p className="text-center text-sm font-bold text-red-500">
              パスワードが違います
            </p>
          )}
          <button
            type="submit"
            className="btn-press w-full rounded-2xl bg-brand py-3.5 text-lg font-bold text-white shadow-lg"
          >
            入る →
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link
            to="/staff"
            className="text-sm font-medium text-gray-400 underline-offset-4 hover:underline"
          >
            食堂スタッフの方はこちら
          </Link>
        </div>
      </div>
    </div>
  )
}
