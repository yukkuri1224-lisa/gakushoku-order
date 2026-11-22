import { useEffect, useState } from 'react'
import { ArrowUpIcon } from '@/components/icons'

// 下までスクロールしたら右下に出る「いちばん上へ」。raised のときは、画面下のカートのボタンの上に出す。
const SHOW_AFTER = 600

export function ScrollTopButton({ raised = false }: { raised?: boolean }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > SHOW_AFTER)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  if (!show) return null
  return (
    <button
      type="button"
      aria-label="いちばん上へ"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed right-4 z-30 flex h-12 w-12 animate-fade-in items-center justify-center rounded-full bg-white text-ink shadow-float ${
        raised ? 'bottom-[calc(6rem+env(safe-area-inset-bottom))]' : 'bottom-[calc(1.5rem+env(safe-area-inset-bottom))]'
      }`}
    >
      <ArrowUpIcon className="h-6 w-6" />
    </button>
  )
}
