// 処理中の全画面表示（支払いの確認中・注文の確定中）。二重タップを防ぎ、待っていることを伝える。
export function ProcessingScreen({
  title,
  description = '画面を閉じずにお待ちください',
}: {
  title: string
  description?: string
}) {
  return (
    <div
      role="status"
      className="flex min-h-dvh flex-col items-center justify-center bg-cream p-6 text-center"
    >
      <div
        className="mb-5 h-10 w-10 animate-spin rounded-full border-[3px] border-brand-soft border-t-brand"
        aria-hidden="true"
      />
      <p className="text-base font-bold">{title}</p>
      {description && <p className="mt-1 text-sm text-ink-sub">{description}</p>}
    </div>
  )
}
