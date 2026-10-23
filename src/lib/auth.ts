// 学生のログイン。
//   VITE_LOGIN_DOMAIN（例: gl.pen-kanagawa.ed.jp）と Firebase の設定がそろっていれば
//   「Google アカウントでログイン（そのドメインのアカウントだけ）」、なければ従来の合言葉。
// ▼本番化の差し替えポイント（ログイン）:
//   Firebase コンソールで Authentication の Google ログインを有効にし、
//   公開先のドメイン（例: gakushoku-order.vercel.app）を「承認済みドメイン」に追加してから
//   Vercel の環境変数 VITE_LOGIN_DOMAIN を設定する（README「学校の Google アカウントでログイン」）。
import { firebaseApp, isFirebaseConfigured } from '@/lib/firebase'

export const LOGIN_DOMAIN = (import.meta.env.VITE_LOGIN_DOMAIN ?? '').trim().toLowerCase()

export const loginMode: 'google' | 'passcode' =
  LOGIN_DOMAIN && isFirebaseConfigured ? 'google' : 'passcode'

/** メールアドレスが指定ドメインのものか（サブドメインや似た名前は通さない） */
export function isAllowedEmail(email: string | null | undefined, domain: string): boolean {
  if (!email) return false
  const at = email.trim().toLowerCase().lastIndexOf('@')
  return at > 0 && email.trim().toLowerCase().slice(at + 1) === domain.toLowerCase()
}

export type LoginErrorCode = 'wrong-domain' | 'cancelled' | 'not-configured' | 'unknown'

export class LoginError extends Error {
  constructor(public code: LoginErrorCode) {
    super(code)
  }
}

export type LoginState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; email: string }

let state: LoginState = { status: 'loading' }
const listeners = new Set<() => void>()
let started = false

function setState(next: LoginState): void {
  state = next
  listeners.forEach((cb) => cb())
}

async function authModule() {
  const mod = await import('firebase/auth')
  return { mod, auth: mod.getAuth(firebaseApp!) }
}

// ログイン状態の見張りを始める（最初に購読されたときに 1 回だけ）。
// 指定ドメイン以外のアカウントでログインしていたら、すぐにログアウトさせる。
function start(): void {
  if (started) return
  started = true
  void authModule().then(({ mod, auth }) => {
    mod.onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified && isAllowedEmail(user.email, LOGIN_DOMAIN)) {
        setState({ status: 'signedIn', email: user.email! })
      } else {
        if (user) void mod.signOut(auth)
        setState({ status: 'signedOut' })
      }
    })
  })
}

export function subscribeLogin(cb: () => void): () => void {
  start()
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getLoginState(): LoginState {
  return state
}

/** Google でログイン。指定ドメイン以外なら LoginError('wrong-domain') */
export async function signInWithGoogle(): Promise<void> {
  const { mod, auth } = await authModule()
  const provider = new mod.GoogleAuthProvider()
  // hd は Google のアカウント選択画面で学校のアカウントを優先して出すためのヒント（制限そのものは下で確認する）
  provider.setCustomParameters({ hd: LOGIN_DOMAIN, prompt: 'select_account' })
  try {
    const { user } = await mod.signInWithPopup(auth, provider)
    if (!user.emailVerified || !isAllowedEmail(user.email, LOGIN_DOMAIN)) {
      await mod.signOut(auth)
      throw new LoginError('wrong-domain')
    }
  } catch (e) {
    if (e instanceof LoginError) throw e
    const code = (e as { code?: string }).code ?? ''
    if (code === 'auth/popup-blocked') {
      await mod.signInWithRedirect(auth, provider)
      return
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw new LoginError('cancelled')
    }
    if (
      code === 'auth/operation-not-allowed' ||
      code === 'auth/configuration-not-found' ||
      code === 'auth/unauthorized-domain'
    ) {
      throw new LoginError('not-configured')
    }
    throw new LoginError('unknown')
  }
}

export async function signOutGoogle(): Promise<void> {
  const { mod, auth } = await authModule()
  await mod.signOut(auth)
}
