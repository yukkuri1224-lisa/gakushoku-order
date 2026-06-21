// 簡易パスワードゲートの状態（sessionStorage）。
// ▼本番化の差し替えポイント（パスワード）:
//   これは本格的なユーザー認証ではなく、注文画面に入る前の簡易ゲート。
//   パスワードは VITE_ACCESS_PASSWORD / VITE_STAFF_PASSWORD（ブラウザ露出）で管理。
//   本格認証が必要なら別途設計すること。
export const GATE_KEY = 'gakushoku.gate_ok'
export const STAFF_KEY = 'gakushoku.staff_ok'

// .env.local 未作成でも動くようデモ既定値をフォールバックに持つ。
export const ACCESS_PASSWORD =
  import.meta.env.VITE_ACCESS_PASSWORD ?? 'gakushoku2026'
export const STAFF_PASSWORD = import.meta.env.VITE_STAFF_PASSWORD ?? 'staff2026'

export function isGateOpen(key: string): boolean {
  return sessionStorage.getItem(key) === '1'
}

export function openGate(key: string): void {
  sessionStorage.setItem(key, '1')
}
