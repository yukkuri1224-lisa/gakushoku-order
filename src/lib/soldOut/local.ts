// 売り切れのローカル実装（Firebase 未設定時）。localStorage に日付ごとに保存し、
// BroadcastChannel + storage イベントで同じ PC の別タブ（厨房タブ ↔ 注文タブ）へ伝える。
import type { SoldOutRepository, Unsubscribe } from './types'

const KEY_PREFIX = 'gakushoku.soldOut.'
const CHANNEL_NAME = 'gakushoku-soldout'

export class LocalSoldOutRepository implements SoldOutRepository {
  private channel: BroadcastChannel | null
  private subs = new Map<string, Set<(ids: string[]) => void>>()

  constructor() {
    this.channel =
      typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null
    this.channel?.addEventListener('message', () => this.emitAll())
    window.addEventListener('storage', (e) => {
      if (e.key?.startsWith(KEY_PREFIX)) this.emitAll()
    })
  }

  private read(day: string): string[] {
    try {
      return JSON.parse(localStorage.getItem(KEY_PREFIX + day) ?? '[]') as string[]
    } catch {
      return []
    }
  }

  private emitAll(): void {
    this.subs.forEach((set, day) => {
      const ids = this.read(day)
      set.forEach((cb) => cb(ids))
    })
  }

  subscribe(day: string, cb: (itemIds: string[]) => void): Unsubscribe {
    let set = this.subs.get(day)
    if (!set) {
      set = new Set()
      this.subs.set(day, set)
    }
    set.add(cb)
    cb(this.read(day))
    return () => {
      set.delete(cb)
    }
  }

  async setSoldOut(day: string, itemId: string, soldOut: boolean): Promise<void> {
    const others = this.read(day).filter((id) => id !== itemId)
    const next = soldOut ? [...others, itemId] : others
    localStorage.setItem(KEY_PREFIX + day, JSON.stringify(next))
    this.channel?.postMessage('changed')
    this.emitAll()
  }
}
