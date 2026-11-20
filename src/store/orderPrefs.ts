// 注文の確認画面で選ぶ「受け取り時間」と「注文する人（生徒／先生）」。
// PayPay から戻ったときにも注文へ記録できるよう、カートと同じく localStorage に残す。
// 受け取り時間は注文ごと（注文したら「できしだい」に戻す）、注文する人は端末ごとに覚えておく。
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Orderer } from '@/types/order'

interface OrderPrefsState {
  /** 予約した受け取り時間（epoch ミリ秒）。null はできしだい */
  pickupAt: number | null
  orderer: Orderer
  setPickupAt: (pickupAt: number | null) => void
  setOrderer: (orderer: Orderer) => void
}

export const useOrderPrefs = create<OrderPrefsState>()(
  persist(
    (set) => ({
      pickupAt: null,
      orderer: 'student',
      setPickupAt: (pickupAt) => set({ pickupAt }),
      setOrderer: (orderer) => set({ orderer }),
    }),
    {
      name: 'gakushoku.orderPrefs',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
