// Vercel Serverless Function: 調理完了の通知（Firebase Cloud Messaging）
//   POST /api/notify  { orderId }   Authorization: Bearer <スタッフの ID トークン>
// 必要な環境変数（Vercel。VITE_ を付けない＝ブラウザに出さない）:
//   FIREBASE_SERVICE_ACCOUNT … Firebase コンソール → プロジェクトの設定 → サービスアカウント →
//                              「新しい秘密鍵を生成」で落とした JSON の中身をまるごと
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { INVALID_TOKEN_CODES, handleNotify, parseServiceAccount } from './_notify-core.js'

/** @returns {import('firebase-admin/app').App | 'missing' | 'invalid'} */
function app() {
  if (getApps().length > 0) return getApps()[0]
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) return 'missing'
  const account = parseServiceAccount(raw)
  if (!account) return 'invalid'
  try {
    return initializeApp({ credential: cert(account) })
  } catch (e) {
    console.error(e)
    return 'invalid'
  }
}

export default async function handler(req, res) {
  const a = app()
  if (a === 'missing') {
    res.status(500).json({ error: '通知の設定（FIREBASE_SERVICE_ACCOUNT）がまだです' })
    return
  }
  if (a === 'invalid') {
    res.status(500).json({
      error: 'FIREBASE_SERVICE_ACCOUNT を読めませんでした。サービスアカウントの JSON ファイルの中身をまるごと貼ってください',
    })
    return
  }
  const db = getFirestore(a)
  try {
    const r = await handleNotify(req, {
      verifyIdToken: (t) => getAuth(a).verifyIdToken(t),
      isStaff: async (uid) => (await db.doc(`staffMembers/${uid}`).get()).exists,
      getOrder: async (id) => {
        const snap = await db.doc(`orders/${id}`).get()
        return snap.exists ? { orderNumber: snap.get('orderNumber'), uid: snap.get('uid') } : null
      },
      getPushTokens: async (uid) => {
        const snap = await db.doc(`pushTokens/${uid}`).get()
        const tokens = snap.exists ? snap.get('tokens') : null
        return Array.isArray(tokens) ? tokens.filter((t) => typeof t === 'string') : []
      },
      send: async ({ tokens, data }) => {
        const r = await getMessaging(a).sendEachForMulticast({
          tokens,
          data,
          webpush: { headers: { Urgency: 'high', TTL: '3600' } },
        })
        const invalidTokens = r.responses.flatMap((x, i) =>
          !x.success && INVALID_TOKEN_CODES.includes(x.error?.code ?? '') ? [tokens[i]] : [],
        )
        r.responses.forEach((x) => {
          if (!x.success) console.warn('通知を送れなかった宛先がありました', x.error?.code)
        })
        return { successCount: r.successCount, invalidTokens }
      },
      removePushTokens: async (uid, tokens) => {
        await db.doc(`pushTokens/${uid}`).update({ tokens: FieldValue.arrayRemove(...tokens) })
      },
    })
    res.status(r.status).json(r.body)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '通知を送れませんでした' })
  }
}
