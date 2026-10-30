// 線のアイコン（24×24、線幅 1.75、currentColor）。絵文字の代わりに使う。
import type { ReactNode } from 'react'

function Icon({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? 'h-6 w-6'}
    >
      {children}
    </svg>
  )
}

type IconProps = { className?: string }

export function CartIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M3 4h2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.2" />
      <circle cx="9.5" cy="19.5" r="1.25" />
      <circle cx="17" cy="19.5" r="1.25" />
    </Icon>
  )
}

export function CloseIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  )
}

export function BackIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M15 5l-7 7 7 7" />
    </Icon>
  )
}

export function ClockIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Icon>
  )
}

export function StoreIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M4 9.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9.5" />
      <path d="M3 9.5L5 4h14l2 5.5a2.5 2.5 0 0 1-4.5 1.2 2.5 2.5 0 0 1-4.5 0 2.5 2.5 0 0 1-4.5 0A2.5 2.5 0 0 1 3 9.5z" />
      <path d="M10 20v-5h4v5" />
    </Icon>
  )
}

export function CheckIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Icon>
  )
}

export function MinusIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M6 12h12" />
    </Icon>
  )
}

export function PlusIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 6v12M6 12h12" />
    </Icon>
  )
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M9 5l7 7-7 7" />
    </Icon>
  )
}

/** 店内で食べる（湯気の立つどんぶり） */
export function EatInIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M3.5 12h17a8.5 7 0 0 1-17 0z" />
      <path d="M9.5 21h5" />
      <path d="M9 8.5c-.8-1 .8-1.8 0-3M12 8.5c-.8-1 .8-1.8 0-3M15 8.5c-.8-1 .8-1.8 0-3" />
    </Icon>
  )
}

/** お持ち帰り（手提げ袋） */
export function TakeoutIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M5.5 8.5h13l-1 11.6a1.5 1.5 0 0 1-1.5 1.4H8a1.5 1.5 0 0 1-1.5-1.4L5.5 8.5z" />
      <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
    </Icon>
  )
}

/** ご利用方法に対応するアイコン */
export function DiningIcon({
  option,
  className,
}: IconProps & { option: 'eat_in' | 'takeout' }) {
  return option === 'eat_in' ? (
    <EatInIcon className={className} />
  ) : (
    <TakeoutIcon className={className} />
  )
}

/** 通知音（ベル） */
export function BellIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </Icon>
  )
}

/** 売り切れ（斜線の丸） */
export function BlockIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M6 6l12 12" />
    </Icon>
  )
}

/** Google の「G」ロゴ（ログインボタン用。Google のブランド色のまま使う） */
export function GoogleLogo({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

/** 共有（iPhone の共有ボタンの形：四角から上向きの矢印） */
export function ShareIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M8.5 9H7a1.5 1.5 0 0 0-1.5 1.5v8A1.5 1.5 0 0 0 7 20h10a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 17 9h-1.5" />
      <path d="M12 14V3.5M8.5 7L12 3.5 15.5 7" />
    </Icon>
  )
}
