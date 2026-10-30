import { useLocation } from 'react-router-dom'

// パソコンなど広い画面で開いたときだけ、スマホで開くための QR コードを横に出す。
// 厨房ボード（/staff）はパソコンやタブレットで使うので出さない。
export function DesktopQrPanel() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/staff')) return null
  return (
    <aside
      aria-label="スマホで開く"
      className="fixed left-8 top-1/2 z-20 hidden w-56 -translate-y-1/2 flex-col items-center rounded-2xl bg-white p-5 text-center shadow-card lg:flex"
    >
      <p className="text-[15px] font-bold">スマホで開く</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-sub">
        カメラで読み取ってください
      </p>
      <img src="/qr-open-on-phone.svg" alt="" className="mt-3 h-40 w-40" />
      <p className="mt-2 break-all text-[11px] text-ink-sub">gakushoku-order.vercel.app</p>
    </aside>
  )
}
