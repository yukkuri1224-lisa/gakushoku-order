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
