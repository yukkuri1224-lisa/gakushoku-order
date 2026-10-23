import type { ReactNode } from 'react'

// 画面のひとまとまり（見出し＋中身）。下に薄灰色の太い区切りを入れて、まとまりを分ける。
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
    <section className="border-b-8 border-surface px-4 pb-5 pt-4">
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
