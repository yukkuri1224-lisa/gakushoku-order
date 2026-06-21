// 注文ドメインの型定義（アプリ全体で共有）

export type OrderStatus = 'paid' | 'preparing' | 'completed'

export type PaymentMethod = 'mock' | 'paypay'

export interface OrderItem {
  name: string
  price: number
  quantity: number
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
