// ログイン（学生とスタッフ）。
//   VITE_LOGIN_DOMAIN（例: gl.pen-kanagawa.ed.jp）を入れると「アカウントでのログイン」になる:
//     - 学生: そのドメインの Google アカウントだけ（Google でログイン）
//     - スタッフ: Firebase に登録したメールアドレスとパスワード。staffMembers/{UID} があるアカウントだけ
//   空なら従来の合言葉（デモ。合言葉はページの中に入るので、守りにはならない）。
// 画面のチェックは案内のため。本当の守りは Firestore のルール（firestore.rules）が受け持つ。
// ▼本番化の手順は README「学校のアカウントでログインする（本番の設定）」。
import { doc, getDoc } from 'firebase/firestore'
import { db, firebaseApp, useFirebaseEmulators } from '@/lib/firebase'

export const LOGIN_DOMAIN = (import.meta.env.VITE_LOGIN_DOMAIN ?? '').trim().toLowerCase()

export const loginMode: 'account' | 'passcode' = LOGIN_DOMAIN ? 'account' : 'passcode'

/** スタッフの名簿（Firebase コンソールで、スタッフのアカウントの UID を ID にした文書を作る） */
export const STAFF_COLLECTION = 'staffMembers'

/** メールアドレスが指定ドメインのものか（サブドメインや似た名前は通さない） */
export function isAllowedEmail(email: string | null | undefined, domain: string): boolean {
  if (!email) return false
  const at = email.trim().toLowerCase().lastIndexOf('@')
  return at > 0 && email.trim().toLowerCase().slice(at + 1) === domain.toLowerCase()
}

export type Role = 'student' | 'staff'

export interface AccountInfo {
  uid: string
  email: string | null
  emailVerified: boolean
  providerIds: string[]
}

type StaffCheck = 'yes' | 'no' | 'error'

/**
 * ログインしたアカウントの役割。
 * 学校の Google アカウント（メール確認済み）なら学生。そうでなければスタッフの名簿を調べる。
 * 名簿を調べられなかったとき（通信が切れている等）は 'unknown'（ログアウトはさせない）。
 */
export async function resolveRole(
  user: AccountInfo,
  domain: string,
  isStaffMember: (uid: string) => Promise<StaffCheck>,
): Promise<Role | 'none' | 'unknown'> {
  if (
    user.emailVerified &&
    user.providerIds.includes('google.com') &&
    isAllowedEmail(user.email, domain)
  ) {
    return 'student'
  }
  const staff = await isStaffMember(user.uid)
  return staff === 'yes' ? 'staff' : staff === 'no' ? 'none' : 'unknown'
}

export type LoginErrorCode =
  | 'wrong-domain'
  | 'wrong-password'
  | 'not-staff'
  | 'too-many'
  | 'disabled'
  | 'network'
  | 'cancelled'
  | 'not-configured'
  | 'unknown'

export class LoginError extends Error {
  constructor(public code: LoginErrorCode) {
    super(code)
  }
}

/** Firebase のエラーコードを、画面で出し分けるエラーに */
export function loginErrorFromCode(code: string): LoginErrorCode {
  switch (code) {
    // どちらが違うかは言わない（アカウントがあるかどうかを探られないように）
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
    case 'auth/missing-password':
      return 'wrong-password'
    case 'auth/too-many-requests':
      return 'too-many'
    case 'auth/user-disabled':
      return 'disabled'
    case 'auth/network-request-failed':
      return 'network'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
    case 'auth/user-cancelled':
      return 'cancelled'
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found':
    case 'auth/unauthorized-domain':
    case 'auth/invalid-api-key':
    case 'auth/admin-restricted-operation':
      return 'not-configured'
    default:
      return 'unknown'
  }
}

export type LoginState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; email: string; uid: string; role: Role }

let state: LoginState = { status: 'loading' }
const listeners = new Set<() => void>()
let started = false

function setState(next: LoginState): void {
  state = next
  listeners.forEach((cb) => cb())
}

let emulatorConnected = false

async function authModule() {
  if (!firebaseApp) throw new LoginError('not-configured')
  const mod = await import('firebase/auth')
  const auth = mod.getAuth(firebaseApp)
  if (useFirebaseEmulators && !emulatorConnected) {
    emulatorConnected = true
    mod.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  }
  return { mod, auth }
}

async function checkStaffMember(uid: string): Promise<StaffCheck> {
  if (!db) return 'no'
  try {
    return (await getDoc(doc(db, STAFF_COLLECTION, uid))).exists() ? 'yes' : 'no'
  } catch (e) {
    return (e as { code?: string }).code === 'permission-denied' ? 'no' : 'error'
  }
}

// 同じアカウントの役割は 1 回だけ調べる（見張りとスタッフのログイン処理の両方から呼ばれる）
const roleCache = new Map<string, Promise<Role | 'none' | 'unknown'>>()

function roleOf(user: {
  uid: string
  email: string | null
  emailVerified: boolean
  providerData: { providerId: string }[]
}): Promise<Role | 'none' | 'unknown'> {
  let p = roleCache.get(user.uid)
  if (!p) {
    p = resolveRole(
      {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        providerIds: user.providerData.map((d) => d.providerId),
      },
      LOGIN_DOMAIN,
      checkStaffMember,
    )
    roleCache.set(user.uid, p)
    // 調べられなかったときは、次にまた調べ直す
    void p.then((r) => {
      if (r === 'unknown') roleCache.delete(user.uid)
    })
  }
  return p
}

// ログイン状態の見張りを始める（最初に購読されたときに 1 回だけ）。
// 学生でもスタッフでもないアカウントでログインしていたら、すぐにログアウトさせる。
function start(): void {
  if (started) return
  started = true
  void authModule()
    .then(({ mod, auth }) => {
      let seq = 0
      mod.onAuthStateChanged(auth, async (user) => {
        const mine = ++seq
        if (!user) {
          roleCache.clear()
          setState({ status: 'signedOut' })
          return
        }
        const role = await roleOf(user)
        if (mine !== seq) return
        if (role === 'student' || role === 'staff') {
          setState({ status: 'signedIn', email: user.email ?? '', uid: user.uid, role })
        } else {
          if (role === 'none') void mod.signOut(auth)
          setState({ status: 'signedOut' })
        }
      })
    })
    .catch(() => setState({ status: 'signedOut' }))
}

export function subscribeLogin(cb: () => void): () => void {
  start()
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getLoginState(): LoginState {
  return state
}

/** ログイン中のアカウントの UID（合言葉のときや、ログインしていなければ undefined） */
export function currentUid(): string | undefined {
  return state.status === 'signedIn' ? state.uid : undefined
}

function toLoginError(e: unknown): LoginError {
  if (e instanceof LoginError) return e
  return new LoginError(loginErrorFromCode((e as { code?: string }).code ?? ''))
}

/** 学生: Google でログイン。指定ドメイン以外なら LoginError('wrong-domain') */
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
    if ((e as { code?: string }).code === 'auth/popup-blocked') {
      await mod.signInWithRedirect(auth, provider)
      return
    }
    throw toLoginError(e)
  }
}

/** スタッフ: メールアドレスとパスワードでログイン。名簿にないアカウントなら LoginError('not-staff') */
export async function signInStaff(email: string, password: string): Promise<void> {
  const { mod, auth } = await authModule()
  try {
    const { user } = await mod.signInWithEmailAndPassword(auth, email.trim(), password)
    const role = await roleOf(user)
    if (role === 'staff') return
    if (role === 'unknown') throw new LoginError('network')
    await mod.signOut(auth)
    throw new LoginError('not-staff')
  } catch (e) {
    throw toLoginError(e)
  }
}

export async function signOutAccount(): Promise<void> {
  const { mod, auth } = await authModule()
  await mod.signOut(auth)
}
