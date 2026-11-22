import { describe, expect, it } from 'vitest'
import { handleNotify, parseServiceAccount } from './_notify-core.js'

function deps(over = {}) {
  const sent = []
  const deleted = []
  return {
    sent,
    deleted,
    verifyIdToken: async (t) => {
      if (t !== 'good-token') throw new Error('bad token')
      return { uid: 'staff1' }
    },
    isStaff: async (uid) => uid === 'staff1',
    getOrder: async (id) => (id === 'o1' ? { orderNumber: 7 } : null),
    getPushToken: async (id) => (id === 'o1' ? 'fcm-token' : null),
    send: async (msg) => {
      sent.push(msg)
    },
    deletePushToken: async (id) => {
      deleted.push(id)
    },
    ...over,
  }
}

const req = (body, auth = 'Bearer good-token', method = 'POST') => ({ method, headers: { authorization: auth }, body })

describe('調理完了の通知（サーバー）', () => {
  it('スタッフが調理完了にした注文の学生へ、注文番号入りの通知を送る', async () => {
    const d = deps()
    const r = await handleNotify(req({ orderId: 'o1' }), d)
    expect(r).toEqual({ status: 200, body: { sent: true } })
    expect(d.sent).toHaveLength(1)
    expect(d.sent[0].token).toBe('fcm-token')
    expect(d.sent[0].data.title).toBe('できあがりました')
    expect(d.sent[0].data.body).toContain('注文番号 7')
    expect(d.sent[0].data.url).toBe('/order/o1')
  })

  it('ログインしていない・スタッフでない人からは送らない', async () => {
    const d = deps()
    expect((await handleNotify(req({ orderId: 'o1' }, ''), d)).status).toBe(401)
    expect((await handleNotify(req({ orderId: 'o1' }, 'Bearer bad'), d)).status).toBe(401)
    const notStaff = deps({ isStaff: async () => false })
    expect((await handleNotify(req({ orderId: 'o1' }), notStaff)).status).toBe(403)
    expect(d.sent).toHaveLength(0)
  })

  it('POST 以外・注文 ID がないときは断る', async () => {
    expect((await handleNotify(req({ orderId: 'o1' }, 'Bearer good-token', 'GET'), deps())).status).toBe(405)
    expect((await handleNotify(req({}), deps())).status).toBe(400)
  })

  it('通知をオンにしていない注文は、何もせず sent: false', async () => {
    const d = deps()
    const r = await handleNotify(req({ orderId: 'o2' }), d)
    expect(r).toEqual({ status: 200, body: { sent: false } })
    expect(d.sent).toHaveLength(0)
  })

  it('使えなくなった通知先（アプリを消した等）は消しておく', async () => {
    const d = deps({
      send: async () => {
        const e = new Error('gone')
        e.code = 'messaging/registration-token-not-registered'
        throw e
      },
    })
    const r = await handleNotify(req({ orderId: 'o1' }), d)
    expect(r).toEqual({ status: 200, body: { sent: false } })
    expect(d.deleted).toEqual(['o1'])
  })
})

describe('サービスアカウントの JSON の読み取り（Vercel に貼った値）', () => {
  const sa = { type: 'service_account', project_id: 'p', client_email: 'x@p.iam.gserviceaccount.com', private_key: '-----BEGIN PRIVATE KEY-----\nAAA\n-----END PRIVATE KEY-----\n' }

  it('そのままの JSON・前後の空白や改行があっても読める', () => {
    expect(parseServiceAccount(JSON.stringify(sa))).toEqual(sa)
    expect(parseServiceAccount(`\n  ${JSON.stringify(sa, null, 2)}  \n`)).toEqual(sa)
  })

  it('貼るときに 1 行にまとめられても、鍵の改行が \\n の文字のままでも読める', () => {
    const oneLine = JSON.stringify(sa, null, 2).replace(/\n/g, ' ')
    expect(parseServiceAccount(oneLine)).toEqual(sa)
    const doubled = JSON.stringify({ ...sa, private_key: sa.private_key.replace(/\n/g, '\\n') })
    expect(parseServiceAccount(doubled).private_key).toBe(sa.private_key)
  })

  it('鍵の文字列の中に本物の改行が入ってしまっていても読める', () => {
    const raw = JSON.stringify(sa).replace(/\\n/g, '\n')
    expect(parseServiceAccount(raw).private_key).toBe(sa.private_key)
  })

  it('JSON でない・必要な項目がないときは null', () => {
    expect(parseServiceAccount('')).toBeNull()
    expect(parseServiceAccount('FIREBASE=abc')).toBeNull()
    expect(parseServiceAccount(JSON.stringify({ type: 'service_account' }))).toBeNull()
  })
})
