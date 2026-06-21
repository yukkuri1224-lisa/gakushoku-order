// カート状態（zustand）。sessionStorage に永続化して /checkout のリロードに耐える。
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { MenuItem } from '@/data/menu'
import type { OrderItem } from '@/types/order'

interface CartState {
  items: OrderItem[]
  add: (item: MenuItem) => void
  increment: (name: string) => void
  decrement: (name: string) => void
  remove: (name: string) => void
  clear: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((s) => {
          const existing = s.items.find((i) => i.name === item.name)
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i,
              ),
            }
          }
          return {
            items: [
              ...s.items,
              { name: item.name, price: item.price, quantity: 1 },
            ],
          }
        }),
      increment: (name) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.name === name ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        })),
      decrement: (name) =>
        set((s) => ({
          items: s.items.flatMap((i) => {
            if (i.name !== name) return [i]
            const q = i.quantity - 1
            return q <= 0 ? [] : [{ ...i, quantity: q }]
          }),
        })),
      remove: (name) =>
        set((s) => ({ items: s.items.filter((i) => i.name !== name) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'gakushoku.cart',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)

// 合計金額・点数はストア外のセレクタヘルパーで算出（再レンダリングを最小化）。
export function cartTotal(items: OrderItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0)
}

export function cartCount(items: OrderItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0)
}
