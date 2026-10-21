// 注文ドメインの型定義（アプリ全体で共有）

export type OrderStatus = 'paid' | 'preparing' | 'completed'

export type PaymentMethod = 'mock' | 'paypay'

/** 注文の1行で選ばれた選択肢（例: サイズ=大盛り） */
export interface SelectedOption {
  groupId: string
  groupLabel: string
  choiceId: string
  choiceLabel: string
  priceDelta: number
  isDefault: boolean // 初期値のままなら true（厨房では表示しない）
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
}

/** 決済前のカート確定情報（注文作成の元データ） */
export interface OrderDraft {
  items: OrderItem[]
  total: number
}

// status -> 日本語ラベル（画面表示で共通利用）
export const STATUS_LABEL: Record<OrderStatus, string> = {
  paid: '受付済み',
  preparing: '調理中',
  completed: '完了',
}
