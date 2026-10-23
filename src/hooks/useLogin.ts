// Google ログインの状態（loginMode が google のときだけ使う）。
import { useSyncExternalStore } from 'react'
import { getLoginState, subscribeLogin, type LoginState } from '@/lib/auth'

export function useLoginState(): LoginState {
  return useSyncExternalStore(subscribeLogin, getLoginState)
}
