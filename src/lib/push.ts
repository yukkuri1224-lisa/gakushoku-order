// 調理完了の通知（Firebase Cloud Messaging のウェブプッシュ）。
//   学生: 通知を許可すると、注文ごとに通知の宛先（pushTokens/{注文ID}）を置く。一度許可すれば、以後の注文にも自動で置く。
//   スタッフ: 「調理完了」を押すと /api/notify に頼み、サーバーがその注文の学生へ送る。
// 通知を表示するのは public/push-sw.js（Workbox の sw.js から読み込む）。
// 使えるのは、アカウントでのログイン・Firebase・VITE_FIREBASE_VAPID_KEY がそろっているときだけ。
// iPhone はホーム画面に追加したとき（iOS 16.4 以降）だけ通知を受け取れる。
import { doc, setDoc } from 'firebase/firestore'
import { currentIdToken, currentUid, loginMode } from '@/lib/auth'
import { db, firebaseApp } from '@/lib/firebase'
import { isStandalone, isTouchMac } from '@/lib/install'

export const VAPID_KEY = (import.meta.env.VITE_FIREBASE_VAPID_KEY ?? '').trim()

export type PushState = 'unsupported' | 'needs-install' | NotificationPermission

export function pushStateFrom(env: {
  enabled: boolean
  supported: boolean
  ios: boolean
  standalone: boolean
  permission: NotificationPermission
}): PushState {
  if (!env.enabled) return 'unsupported'
  if (!env.supported || (env.ios && !env.standalone)) return env.ios ? 'needs-install' : 'unsupported'
  return env.permission
}

/** この端末・ブラウザで、いま通知が使えるか */
export function pushState(): PushState {
  const supported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  return pushStateFrom({
    enabled: loginMode === 'account' && Boolean(firebaseApp) && Boolean(VAPID_KEY),
    supported,
    ios: typeof navigator !== 'undefined' && (/iPhone|iPad|iPod/i.test(navigator.userAgent) || isTouchMac()),
    standalone: isStandalone(),
    permission: supported ? Notification.permission : 'default',
  })
}

async function fcmToken(): Promise<string | null> {
  const { getMessaging, getToken, isSupported } = await import('firebase/messaging')
  if (!firebaseApp || !(await isSupported())) return null
  const registration = await navigator.serviceWorker.ready
  return getToken(getMessaging(firebaseApp), { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration })
}

/** 許可済みなら、この注文の通知の宛先を置く（許可を求めはしない） */
export async function registerOrderForPush(orderId: string): Promise<void> {
  if (pushState() !== 'granted' || !db) return
  const uid = currentUid()
  if (!uid) return
  const token = await fcmToken()
  if (!token) return
  await setDoc(doc(db, 'pushTokens', orderId), { token, uid, createdAt: Date.now() })
}

/** 通知を許可してもらい、この注文の宛先を置く（ボタンを押したときに呼ぶ） */
export async function enablePushForOrder(orderId: string): Promise<PushState> {
  const permission = await Notification.requestPermission()
  if (permission === 'granted') await registerOrderForPush(orderId)
  return permission
}

/** スタッフ: 調理完了の通知をサーバーに頼む（届かなくても注文の処理は止めない） */
export async function notifyOrderReady(orderId: string): Promise<void> {
  if (loginMode !== 'account' || !firebaseApp) return
  const token = await currentIdToken()
  if (!token) return
  const res = await fetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ orderId }),
  })
  if (!res.ok) console.warn('通知を送れませんでした', res.status, await res.text().catch(() => ''))
}
