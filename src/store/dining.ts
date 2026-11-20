// ご利用方法（店内で食べる / お持ち帰り）の選択。
// PayPay から戻ったときにも注文へ記録できるよう、カートと同じく localStorage に残す。
// 変えたときは、カートの料理の価格もお持ち帰りの容器代に合わせて直す。
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { useCartStore } from '@/store/cart'
import type { DiningOption } from '@/types/order'

interface DiningState {
  option: DiningOption | null
  setOption: (option: DiningOption) => void
}

export const useDiningStore = create<DiningState>()(
  persist(
    (set) => ({
      option: null,
      setOption: (option) => {
        set({ option })
        useCartStore.getState().reprice(option)
      },
    }),
    {
      name: 'gakushoku.dining',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
