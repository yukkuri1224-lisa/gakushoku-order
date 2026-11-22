// メニューの保存先。注文・売り切れと同じく、Firestore 実装とローカル実装（Firebase 未設定時）を
// getMenuRepository() が差し替える。
import type { MenuItem } from '@/data/menu'
import type { StoredMenuItem } from './convert'

export type Unsubscribe = () => void

/** 保存してある 1 品と、その並び順 */
export interface MenuEntry {
  item: MenuItem
  sortOrder: number
}

export interface MenuRepository {
  /** 並び順のメニューを購読する。まだ食堂が保存していない（または読めない）ときは null */
  subscribe(cb: (entries: MenuEntry[] | null) => void): Unsubscribe
  /** 1 品を保存（新しい商品も同じ） */
  save(id: string, data: StoredMenuItem): Promise<void>
  /** まとめて保存（ほかの商品はそのまま）。はじめての保存で、いまのメニューを丸ごと移すときなど */
  saveAll(entries: { id: string; data: StoredMenuItem }[]): Promise<void>
  /** 1 品を削除 */
  remove(id: string): Promise<void>
}
