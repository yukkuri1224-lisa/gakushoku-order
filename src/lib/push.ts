// 調理完了の通知（Firebase Cloud Messaging のウェブプッシュ）。
//   学生: 通知を許可すると、この端末を通知の宛先に加える（pushTokens/{UID} の tokens。アカウントごと）。
//         以後は、どの画面・どのブラウザで注文しても、調理完了でこの端末に届く。
//         （注文ごとではないのは、iPhone では PayPay の支払いのあと Safari に戻ってしまい、
//           ホーム画面のアプリで注文の画面を開けないため）
//   スタッフ: 「調理完了」を押すと /api/notify に頼み、サーバーがその注文の学生の端末すべてへ送る。
// 通知を表示するのは public/push-sw.js（Workbox の sw.js から読み込む）。
// 使えるのは、アカウントでのログイン・Firebase・VITE_FIREBASE_VAPID_KEY がそろっているときだけ。
// iPhone はホーム画面に追加したとき（iOS 16.4 以降）だけ通知を受け取れる。
import { doc, getDoc, setDoc } from 'firebase/firestore'
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
  const get = () =>
    getToken(getMessaging(firebaseApp!), { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration })
  try {
    return await get()
  } catch (e) {
    // iPhone では、許可した直後の 1 回目に失敗することがあるので、少し待ってもう一度
    console.warn('通知の宛先を作れませんでした。もう一度試します', e)
    await new Promise((r) => setTimeout(r, 1500))
    return get()
  }
}

/** 1 人が通知を受け取れる端末の数（新しい順に残す） */
const MAX_DEVICES = 5
let registeredThisSession = false

/** 許可済みなら、この端末を通知の宛先に加える（許可を求めはしない。開くたびに 1 回だけ） */
export async function registerDeviceForPush(): Promise<boolean> {
  if (registeredThisSession) return true
  if (pushState() !== 'granted' || !db) return false
  const uid = currentUid()
  if (!uid) return false
  const token = await fcmToken()
  if (!token) return false
  const ref = doc(db, 'pushTokens', uid)
  const old = await getDoc(ref)
    .then((s) => (s.data()?.tokens as string[] | undefined) ?? [])
    .catch(() => [] as string[])
  const tokens = [token, ...old.filter((t) => t !== token)].slice(0, MAX_DEVICES)
  await setDoc(ref, { tokens, updatedAt: Date.now() })
  registeredThisSession = true
  return true
}

/** 通知を許可してもらい、この端末を宛先に加える（ボタンを押したときに呼ぶ） */
export async function enablePush(): Promise<PushState> {
  const permission = await Notification.requestPermission()
  if (permission === 'granted') await registerDeviceForPush()
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
