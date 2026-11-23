// この端末でした注文の記録（「注文中」カード用）。会員機能がないため端末の localStorage に持つ。
// 表示するのは今日の、まだ受け取っていない注文だけ。前日以前の記録は読み出すときに消す。
import { todayKey } from '@/lib/orders/types'

const KEY = 'gakushoku.myOrders'
const MAX = 5

interface Entry {
  id: string
  createdAt: number
  /** 「受け取りました」を押した注文（カードに出さない） */
  received?: true
}

function read(): Entry[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v)
      ? v.filter(
          (e): e is Entry =>
            typeof e?.id === 'string' && typeof e?.createdAt === 'number',
        )
      : []
  } catch {
    return []
  }
}

function write(list: Entry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // 保存できない環境（プライベートブラウズ等）では記録しない
  }
}

/** 注文を記録する。同じIDはまとめる（登録のやり直しで重複しない。受け取った印は残す） */
export function rememberOrder(id: string, createdAt: number): void {
  const old = read()
  const received = old.find((e) => e.id === id)?.received
  write([...old.filter((e) => e.id !== id), { id, createdAt, ...(received ? { received } : {}) }])
}

/** 「受け取りました」を押した注文に印を付ける（以後、注文中のカードに出さない） */
export function markReceived(id: string): void {
  write(read().map((e) => (e.id === id ? { ...e, received: true as const } : e)))
}

/** 受け取った注文か */
export function isReceived(id: string): boolean {
  return read().some((e) => e.id === id && e.received)
}

/** 今日の、まだ受け取っていない注文IDを新しい順に（最大 5 件） */
export function todaysOrderIds(now: Date = new Date()): string[] {
  const today = todayKey(now)
  const list = read().filter((e) => todayKey(new Date(e.createdAt)) === today)
  write(list)
  return list
    .filter((e) => !e.received)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX)
    .map((e) => e.id)
}
