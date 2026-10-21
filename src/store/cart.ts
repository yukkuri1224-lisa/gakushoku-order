// カート状態（zustand）。localStorage に永続化して /checkout のリロードや
// PayPay からの戻りに耐える。
// 行は「商品＋選択肢の組み合わせ」ごと（itemKey）。旧バージョンの行は商品名で識別する。
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { itemKey } from '@/lib/menuOptions'
import type { OrderItem } from '@/types/order'

interface CartState {
  items: OrderItem[]
  /** 同じ組み合わせの行があれば数量を足す。なければ行を追加 */
  add: (line: OrderItem) => void
  increment: (key: string) => void
  decrement: (key: string) => void
  remove: (key: string) => void
  clear: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (line) =>
        set((s) => {
          const key = itemKey(line)
          if (s.items.some((i) => itemKey(i) === key)) {
            return {
              items: s.items.map((i) =>
                itemKey(i) === key
                  ? { ...i, quantity: i.quantity + line.quantity }
                  : i,
              ),
            }
          }
          return { items: [...s.items, line] }
        }),
      increment: (key) =>
        set((s) => ({
          items: s.items.map((i) =>
            itemKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        })),
      decrement: (key) =>
        set((s) => ({
          items: s.items.flatMap((i) => {
            if (itemKey(i) !== key) return [i]
            const q = i.quantity - 1
            return q <= 0 ? [] : [{ ...i, quantity: q }]
          }),
        })),
      remove: (key) =>
        set((s) => ({ items: s.items.filter((i) => itemKey(i) !== key) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'gakushoku.cart',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

// 合計金額・点数はストア外のセレクタヘルパーで算出（再レンダリングを最小化）。
export function cartTotal(items: OrderItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0)
}

export function cartCount(items: OrderItem[]): number {
  return items.reduce((n, i) => n + i.quantity, 0)
}
