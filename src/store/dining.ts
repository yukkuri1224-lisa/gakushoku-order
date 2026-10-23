// ご利用方法（店内で食べる / お持ち帰り）の選択。
// PayPay から戻ったときにも注文へ記録できるよう、カートと同じく localStorage に残す。
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { DiningOption } from '@/types/order'

interface DiningState {
  option: DiningOption | null
  setOption: (option: DiningOption) => void
}

export const useDiningStore = create<DiningState>()(
  persist(
    (set) => ({
      option: null,
      setOption: (option) => set({ option }),
    }),
    {
      name: 'gakushoku.dining',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
