// 調理完了の通知を送るかどうかを決めて送る（Firebase の部分は deps で受け取る。テストでは差し替える）。
//   POST /api/notify  { orderId }   Authorization: Bearer <スタッフの Firebase の ID トークン>
// スタッフ（staffMembers にあるアカウント）だけが呼べる。注文した学生が通知をオンにした端末
// （pushTokens/{学生の UID} の tokens）すべてへ送る。ファイル名が _ で始まるので、Vercel はこれを関数として公開しない。
//
// 宛先は「注文ごと」ではなく「学生のアカウント・端末ごと」。iPhone では PayPay の支払いのあと
// Safari に戻ってしまい（ホーム画面のアプリに戻れない）、注文の画面で通知を設定できないため。

/**
 * @param {{ method?: string, headers: Record<string, string | undefined>, body?: any }} req
 * @param {{
 *   verifyIdToken: (token: string) => Promise<{ uid: string }>,
 *   isStaff: (uid: string) => Promise<boolean>,
 *   getOrder: (orderId: string) => Promise<{ orderNumber: number, uid?: string } | null>,
 *   getPushTokens: (uid: string) => Promise<string[]>,
 *   send: (message: { tokens: string[], data: Record<string, string> }) =>
 *     Promise<{ successCount: number, invalidTokens: string[] }>,
 *   removePushTokens: (uid: string, tokens: string[]) => Promise<void>,
 * }} deps
 * @returns {Promise<{ status: number, body: Record<string, unknown> }>}
 */
export async function handleNotify(req, deps) {
  if (req.method !== 'POST') return { status: 405, body: { error: 'POST だけ受け付けます' } }

  const auth = req.headers.authorization ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return { status: 401, body: { error: 'ログインが必要です' } }
  let uid
  try {
    ;({ uid } = await deps.verifyIdToken(token))
  } catch {
    return { status: 401, body: { error: 'ログインを確かめられませんでした' } }
  }
  if (!(await deps.isStaff(uid))) return { status: 403, body: { error: 'スタッフだけが使えます' } }

  const body = (typeof req.body === 'string' ? safeJson(req.body) : req.body) ?? {}
  const orderId = typeof body.orderId === 'string' ? body.orderId : ''
  if (!orderId || orderId.length > 200) return { status: 400, body: { error: 'orderId が必要です' } }

  const order = await deps.getOrder(orderId)
  if (!order?.uid) return { status: 200, body: { sent: false } }
  const tokens = await deps.getPushTokens(order.uid)
  if (tokens.length === 0) return { status: 200, body: { sent: false } }

  const result = await deps.send({
    tokens,
    data: {
      title: 'できあがりました',
      body: `注文番号 ${order.orderNumber} ができあがりました。カウンターでお受け取りください。`,
      url: `/order/${orderId}`,
      tag: `ready-${orderId}`,
    },
  })
  // アプリを消した・通知を切ったなどで使えなくなった宛先は消しておく
  if (result.invalidTokens.length > 0) {
    await deps.removePushTokens(order.uid, result.invalidTokens).catch(() => {})
  }
  return { status: 200, body: { sent: result.successCount > 0 } }
}

/** 使えなくなった宛先を表す FCM のエラー */
export const INVALID_TOKEN_CODES = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]

function safeJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/**
 * Vercel の環境変数 FIREBASE_SERVICE_ACCOUNT（サービスアカウントの JSON）を読む。
 * 貼り付けたときに 1 行にまとめられた・鍵の改行が \n の文字のまま・鍵の中に本物の改行が入った、でも読めるようにする。
 * 読めない・必要な項目がないときは null。
 * @param {string | undefined} raw
 */
export function parseServiceAccount(raw) {
  const text = (raw ?? '').trim()
  if (!text) return null
  const obj = safeJson(text) ?? safeJson(text.replace(/\r?\n/g, '\\n'))
  if (!obj || typeof obj !== 'object') return null
  const { project_id: projectId, client_email: clientEmail, private_key: privateKey } = obj
  if (typeof projectId !== 'string' || typeof clientEmail !== 'string' || typeof privateKey !== 'string') {
    return null
  }
  return { ...obj, private_key: privateKey.replace(/\\n/g, '\n') }
}
