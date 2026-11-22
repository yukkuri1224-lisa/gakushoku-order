// Vercel Serverless Function: 調理完了の通知（Firebase Cloud Messaging）
//   POST /api/notify  { orderId }   Authorization: Bearer <スタッフの ID トークン>
// 必要な環境変数（Vercel。VITE_ を付けない＝ブラウザに出さない）:
//   FIREBASE_SERVICE_ACCOUNT … Firebase コンソール → プロジェクトの設定 → サービスアカウント →
//                              「新しい秘密鍵を生成」で落とした JSON の中身をまるごと
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { handleNotify } from './_notify-core.js'

function app() {
  if (getApps().length > 0) return getApps()[0]
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) return null
  return initializeApp({ credential: cert(JSON.parse(raw)) })
}

export default async function handler(req, res) {
  const a = app()
  if (!a) {
    res.status(500).json({ error: '通知の設定（FIREBASE_SERVICE_ACCOUNT）がまだです' })
    return
  }
  const db = getFirestore(a)
  try {
    const r = await handleNotify(req, {
      verifyIdToken: (t) => getAuth(a).verifyIdToken(t),
      isStaff: async (uid) => (await db.doc(`staffMembers/${uid}`).get()).exists,
      getOrder: async (id) => {
        const snap = await db.doc(`orders/${id}`).get()
        return snap.exists ? { orderNumber: snap.get('orderNumber') } : null
      },
      getPushToken: async (id) => {
        const snap = await db.doc(`pushTokens/${id}`).get()
        return snap.exists ? (snap.get('token') ?? null) : null
      },
      send: async ({ token, data }) => {
        await getMessaging(a).send({
          token,
          data,
          webpush: { headers: { Urgency: 'high', TTL: '3600' } },
        })
      },
      deletePushToken: async (id) => {
        await db.doc(`pushTokens/${id}`).delete()
      },
    })
    res.status(r.status).json(r.body)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '通知を送れませんでした' })
  }
}
