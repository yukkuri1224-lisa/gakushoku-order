// メニューのローカル実装（Firebase 未設定時）。localStorage に保存し、
// BroadcastChannel + storage イベントで同じ PC の別タブ（厨房タブ ↔ 注文タブ）へ伝える。
import { fromStored, type StoredMenuItem } from './convert'
import type { MenuEntry, MenuRepository, Unsubscribe } from './types'

const KEY = 'gakushoku.menu'
const CHANNEL_NAME = 'gakushoku-menu'

type Stored = Record<string, StoredMenuItem>

export class LocalMenuRepository implements MenuRepository {
  private channel: BroadcastChannel | null
  private subs = new Set<(entries: MenuEntry[] | null) => void>()

  constructor() {
    this.channel =
      typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null
    this.channel?.addEventListener('message', () => this.emit())
    window.addEventListener('storage', (e) => {
      if (e.key === KEY) this.emit()
    })
  }

  private read(): Stored | null {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as Stored) : null
    } catch {
      return null
    }
  }

  private list(): MenuEntry[] | null {
    const all = this.read()
    if (!all || Object.keys(all).length === 0) return null
    return Object.entries(all)
      .sort(([, a], [, b]) => a.sortOrder - b.sortOrder)
      .map(([id, d]) => ({ item: fromStored(id, d), sortOrder: d.sortOrder }))
  }

  private write(all: Stored): void {
    localStorage.setItem(KEY, JSON.stringify(all))
    this.channel?.postMessage('changed')
    this.emit()
  }

  private emit(): void {
    const items = this.list()
    this.subs.forEach((cb) => cb(items))
  }

  subscribe(cb: (entries: MenuEntry[] | null) => void): Unsubscribe {
    this.subs.add(cb)
    cb(this.list())
    return () => {
      this.subs.delete(cb)
    }
  }

  async save(id: string, data: StoredMenuItem): Promise<void> {
    this.write({ ...(this.read() ?? {}), [id]: data })
  }

  async saveAll(entries: { id: string; data: StoredMenuItem }[]): Promise<void> {
    this.write({ ...(this.read() ?? {}), ...Object.fromEntries(entries.map((e) => [e.id, e.data])) })
  }

  async remove(id: string): Promise<void> {
    const all = { ...(this.read() ?? {}) }
    delete all[id]
    this.write(all)
  }
}
