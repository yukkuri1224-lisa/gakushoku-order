// 合言葉のデモの入口（localStorage に「入った」印を残すだけ）。
// ⚠ 本当の守りにはならない: 合言葉はページの JavaScript にそのまま入るので、だれでも調べられる。
//   実際に使うときは VITE_LOGIN_DOMAIN を入れて、アカウントでのログイン（src/lib/auth.ts）に切り替える。
//   切り替えると、合言葉はページから消える（下の三項演算子がビルド時に空文字へまとめられる）。
export const GATE_KEY = 'gakushoku.gate_ok'
export const STAFF_KEY = 'gakushoku.staff_ok'

// .env.local 未作成でも動くようデモ既定値をフォールバックに持つ。
export const ACCESS_PASSWORD = import.meta.env.VITE_LOGIN_DOMAIN
  ? ''
  : (import.meta.env.VITE_ACCESS_PASSWORD ?? 'gakushoku2026')
export const STAFF_PASSWORD = import.meta.env.VITE_LOGIN_DOMAIN
  ? ''
  : (import.meta.env.VITE_STAFF_PASSWORD ?? 'staff2026')

export function isGateOpen(key: string): boolean {
  return localStorage.getItem(key) === '1'
}
export function openGate(key: string): void {
  localStorage.setItem(key, '1')
}
