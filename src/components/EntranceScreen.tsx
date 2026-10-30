import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MealgoLogo } from '@/components/Logo'

// 入口の画面（学生のログイン・合言葉、スタッフの合言葉で共通）。
// 落ち着いた地に、mealgo のロゴ・見出し・入力やボタンだけを置く（オレンジはロゴとボタンだけ）。
export function EntranceScreen({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow?: string
  title: ReactNode
  description: string
  children: ReactNode
  footer: { to: string; label: string }
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-cream px-6">
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
        <MealgoLogo className="w-48" />
        {eyebrow && <p className="mt-8 text-sm font-bold text-ink-sub">{eyebrow}</p>}
        <h1 className={`text-keep text-2xl font-bold leading-tight text-ink ${eyebrow ? 'mt-1' : 'mt-8'}`}>
          {title}
        </h1>
        <p className="text-keep mt-3 text-[15px] leading-relaxed text-ink-sub">{description}</p>
        <div className="mt-10">{children}</div>
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
