// 画面下に短く出すお知らせ（「カートに追加しました」など）。2 秒で消える。
import { create } from 'zustand'

interface ToastState {
  message: string | null
  show: (message: string) => void
}

let timer: ReturnType<typeof setTimeout> | undefined

export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (message) => {
    clearTimeout(timer)
    set({ message })
    timer = setTimeout(() => set({ message: null }), 2000)
  },
}))
