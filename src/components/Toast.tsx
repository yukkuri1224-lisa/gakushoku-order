import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useToast } from '@/store/toast'
import { CheckIcon } from '@/components/icons'

// App 直下に常設。useToast().show() で表示する。
// 前の画面のお知らせを次の画面に持ち越さないよう、画面が切り替わったら消す。
export function Toast() {
  const message = useToast((s) => s.message)
  const hide = useToast((s) => s.hide)
  const { pathname } = useLocation()
  useEffect(() => {
    hide()
  }, [pathname, hide])
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-28 z-50 flex justify-center px-4"
    >
      {message && (
        <div className="flex animate-fade-in items-center gap-2 rounded-lg bg-ink px-4 py-3 text-sm font-bold text-white">
          <CheckIcon className="h-5 w-5" />
          {message}
        </div>
      )}
    </div>
  )
}
