import type { ReactNode } from 'react'

// 画面のひとまとまり（見出し＋中身）。白いカードにして、あたたかい地の上で分ける。
export function Section({
  title,
  titleId,
  action,
  children,
}: {
  title: string
  titleId?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="mx-4 mt-3 rounded-2xl bg-white px-4 pb-4 pt-3 shadow-card">
      <div className="flex min-h-11 items-center justify-between">
        <h2 id={titleId} className="text-[15px] font-bold">
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-1">{children}</div>
    </section>
  )
}
