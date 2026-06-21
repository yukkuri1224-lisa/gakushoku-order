// PayPay 風モック決済モーダルの状態管理。
// MockPaymentProvider.pay() が requestApproval() を呼び、ユーザーが
// 「支払う」/「キャンセル」を押すまで Promise を保留する。
import { create } from 'zustand'

interface PaymentUiState {
  open: boolean
  amount: number
  resolve: ((approved: boolean) => void) | null
  /** モーダルを開き、承認/キャンセルの結果を Promise で返す */
  requestApproval: (amount: number) => Promise<boolean>
  approve: () => void
  cancel: () => void
}

export const usePaymentUiStore = create<PaymentUiState>((set, get) => ({
  open: false,
  amount: 0,
  resolve: null,
  requestApproval: (amount) =>
    new Promise<boolean>((resolve) => {
      set({ open: true, amount, resolve })
    }),
  approve: () => {
    get().resolve?.(true)
    set({ open: false, resolve: null })
  },
  cancel: () => {
    get().resolve?.(false)
    set({ open: false, resolve: null })
  },
}))
