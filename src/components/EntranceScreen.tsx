import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark } from '@/components/icons'

// 入口の画面（学生のログイン・合言葉、スタッフの合言葉で共通）。
// 上にメニューのイラストを並べたあたたかい帯、下の白いカードに入力やボタンを置く。
const HERO_IMAGES = [
  { src: '/menu/illust/ramen.jpg', className: 'left-[-18px] top-6 h-28 w-28 -rotate-6' },
  { src: '/menu/irasutoya/katsu_curry.jpg', className: 'right-[-14px] top-3 h-32 w-32 rotate-6' },
  { src: '/menu/irasutoya/takoyaki.jpg', className: 'right-16 top-[118px] h-20 w-20 -rotate-3' },
  { src: '/menu/illust/tanuki.jpg', className: 'left-20 top-[132px] h-16 w-16 rotate-3' },
]

export function EntranceScreen({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footer: { to: string; label: string }
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-brand-bright to-brand">
      <div aria-hidden="true" className="relative mx-auto h-56 w-full max-w-md overflow-hidden">
        {HERO_IMAGES.map((img) => (
          <img
            key={img.src}
            src={img.src}
            alt=""
            className={`absolute rounded-full border-4 border-white/40 bg-white object-cover shadow-float ${img.className}`}
          />
        ))}
      </div>
      <main className="pb-safe mx-auto -mt-6 flex w-full max-w-md flex-1 flex-col rounded-t-[28px] bg-cream px-6 pt-7">
        <div className="flex items-center gap-2">
          <BrandMark className="h-7 w-7" />
          <p className="text-sm font-bold text-brand-dark">{eyebrow}</p>
        </div>
        <h1 className="text-keep mt-3 text-[28px] font-bold leading-tight text-ink">{title}</h1>
        <p className="text-keep mt-2 text-[15px] leading-relaxed text-ink-sub">{description}</p>
        <div className="mt-8">{children}</div>
        <div className="mt-auto pt-8 text-center">
          <Link
            to={footer.to}
            className="inline-flex h-11 items-center text-sm text-ink-sub underline underline-offset-4"
          >
            {footer.label}
          </Link>
        </div>
      </main>
    </div>
  )
}
