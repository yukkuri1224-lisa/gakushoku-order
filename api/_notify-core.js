// 調理完了の通知を送るかどうかを決めて送る（Firebase の部分は deps で受け取る。テストでは差し替える）。
//   POST /api/notify  { orderId }   Authorization: Bearer <スタッフの Firebase の ID トークン>
// スタッフ（staffMembers にあるアカウント）だけが呼べる。学生が通知をオンにした注文
// （pushTokens/{orderId}）にだけ送る。ファイル名が _ で始まるので、Vercel はこれを関数として公開しない。

/**
 * @param {{ method?: string, headers: Record<string, string | undefined>, body?: any }} req
 * @param {{
 *   verifyIdToken: (token: string) => Promise<{ uid: string }>,
 *   isStaff: (uid: string) => Promise<boolean>,
 *   getOrder: (orderId: string) => Promise<{ orderNumber: number } | null>,
 *   getPushToken: (orderId: string) => Promise<string | null>,
 *   send: (message: { token: string, data: Record<string, string> }) => Promise<void>,
 *   deletePushToken: (orderId: string) => Promise<void>,
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

  const body = typeof req.body === 'string' ? safeJson(req.body) : (req.body ?? {})
  const orderId = typeof body.orderId === 'string' ? body.orderId : ''
  if (!orderId || orderId.length > 200) return { status: 400, body: { error: 'orderId が必要です' } }

  const [order, pushToken] = await Promise.all([deps.getOrder(orderId), deps.getPushToken(orderId)])
  if (!order || !pushToken) return { status: 200, body: { sent: false } }

  try {
    await deps.send({
      token: pushToken,
      data: {
        title: 'できあがりました',
        body: `注文番号 ${order.orderNumber} ができあがりました。カウンターでお受け取りください。`,
        url: `/order/${orderId}`,
        tag: `ready-${orderId}`,
      },
    })
    return { status: 200, body: { sent: true } }
  } catch (e) {
    const code = /** @type {{ code?: string }} */ (e).code ?? ''
    // アプリを消した・通知を切ったなどで使えなくなった通知先は消しておく
    if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
      await deps.deletePushToken(orderId).catch(() => {})
      return { status: 200, body: { sent: false } }
    }
    throw e
  }
}

function safeJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}
