// ログインの状態（loginMode が account のときだけ使う）。
import { useSyncExternalStore } from 'react'
import { getLoginState, subscribeLogin, type LoginState } from '@/lib/auth'

export function useLoginState(): LoginState {
  return useSyncExternalStore(subscribeLogin, getLoginState)
}
