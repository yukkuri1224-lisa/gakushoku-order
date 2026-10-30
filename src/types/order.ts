// 注文ドメインの型定義（アプリ全体で共有）

export type OrderStatus = 'paid' | 'preparing' | 'completed'

export type PaymentMethod = 'mock' | 'paypay'

/** ご利用方法（店内で食べる / お持ち帰り） */
export type DiningOption = 'eat_in' | 'takeout'

/** 注文の1行で選ばれた選択肢（例: サイズ=大盛り） */
export interface SelectedOption {
  groupId: string
  groupLabel: string
  choiceId: string
  choiceLabel: string
  summaryLabel: string // カート・厨房での表示名（例: 大盛り / 福神漬けなし）
  priceDelta: number
  isDefault: boolean // 初期値のままなら true（厨房では表示しない）
  mustChoose?: true // 初期値がなく毎回選ぶ選択肢（うどん／そば）。厨房では普通の表示にする
}

/**
 * カート・注文の1行。
 * key / menuItemId / options は選択肢対応後に追加した項目で、
 * それ以前に保存された注文やカートには無い（itemKey() で name にフォールバック）。
 */
export interface OrderItem {
  key?: string // menuItemId + 選択肢の組み合わせ
  menuItemId?: string
  name: string
  price: number // 選択肢込みの単価（円）
  quantity: number
  options?: SelectedOption[]
}

/** Firestore / ローカルに保存される注文ドキュメント */
export interface Order {
  id: string // 自動ID（Firestore のドキュメントID / ローカルの採番ID）
  orderNumber: number // 当日の通し番号
  items: OrderItem[]
  total: number // 合計金額（円）
  status: OrderStatus
  paymentMethod: PaymentMethod
  createdAt: number // epoch ミリ秒
  completedAt?: number
  diningOption?: DiningOption // 利用方法の選択を入れる前の注文には無い
  uid?: string // 注文した学生（アカウントでのログインのとき）。合言葉のデモの注文には無い
}

/** 決済前のカート確定情報（注文作成の元データ） */
export interface OrderDraft {
  items: OrderItem[]
  total: number
  diningOption?: DiningOption
}

// status -> 日本語ラベル（画面表示で共通利用）
export const STATUS_LABEL: Record<OrderStatus, string> = {
  paid: '受付済み',
  preparing: '調理中',
  completed: '完了',
}

// ご利用方法 -> 日本語ラベル（学生向け / 厨房向けの短い表記）
export const DINING_LABEL: Record<DiningOption, string> = {
  eat_in: '店内で食べる',
  takeout: 'お持ち帰り',
}

export const DINING_SHORT: Record<DiningOption, string> = {
  eat_in: '店内',
  takeout: '持ち帰り',
}
