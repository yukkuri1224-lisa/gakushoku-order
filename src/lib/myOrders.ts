// この端末でした注文の記録（「注文中」カード用）。会員機能がないため端末の localStorage に持つ。
// 表示するのは今日の注文だけ。前日以前の記録は読み出すときに消す。
import { todayKey } from '@/lib/orders/types'

const KEY = 'gakushoku.myOrders'
const MAX = 5

interface Entry {
  id: string
  createdAt: number
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

/** 注文を記録する。同じIDはまとめる（登録のやり直しで重複しない） */
export function rememberOrder(id: string, createdAt: number): void {
  write([...read().filter((e) => e.id !== id), { id, createdAt }])
}

/** 今日の注文IDを新しい順に（最大 5 件） */
export function todaysOrderIds(now: Date = new Date()): string[] {
  const today = todayKey(now)
  const list = read().filter((e) => todayKey(new Date(e.createdAt)) === today)
  write(list)
  return list
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX)
    .map((e) => e.id)
}
