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
