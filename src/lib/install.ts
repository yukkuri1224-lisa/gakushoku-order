// ホーム画面に追加（PWA のインストール）まわり。
// Android の Chrome などは beforeinstallprompt を受け取ってボタンで追加できる。
// iPhone・iPad は自動では出せないため、共有ボタンからの手順を案内する。
export type InstallMethod = 'installed' | 'prompt' | 'ios' | 'none'

export function installMethod(env: {
  ua: string
  standalone: boolean
  canPrompt: boolean
  touchMac: boolean
}): InstallMethod {
  if (env.standalone) return 'installed'
  if (env.canPrompt) return 'prompt'
  if (/iPhone|iPad|iPod/i.test(env.ua) || env.touchMac) return 'ios'
  return 'none'
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((cb) => cb())

/** アプリ起動時に 1 回呼ぶ。ブラウザの「追加できます」の合図を受け取っておく */
export function captureInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // ブラウザ既定の小さな案内の代わりに、画面の案内から追加してもらう
    deferred = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    notify()
  })
}

export function subscribeInstall(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function canPromptInstall(): boolean {
  return deferred !== null
}

/** ブラウザの「ホーム画面に追加」を出す。追加されたら true */
export async function promptInstall(): Promise<boolean> {
  const e = deferred
  if (!e) return false
  await e.prompt()
  const { outcome } = await e.userChoice
  deferred = null
  notify()
  return outcome === 'accepted'
}

/** ホーム画面から（アプリとして）開いているか */
export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as { standalone?: boolean }).standalone === true
  )
}

/** iPad は Mac と同じ名乗りをするため、タッチできる Mac を iPad とみなす */
export function isTouchMac(): boolean {
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}
