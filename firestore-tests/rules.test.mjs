// firestore.rules（本番用ルール）のテスト。Firestore エミュレーターの上で、
// 「通すもの」と「断るもの」を実際に読み書きして確かめる。実行方法は README.md。
import { after, before, beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'

const DAY = '2026-10-30'

let env

/** Google でログインした人のトークン */
const google = (email, emailVerified = true) => ({
  email,
  email_verified: emailVerified,
  firebase: { sign_in_provider: 'google.com' },
})

const db = {
  anon: () => env.unauthenticatedContext().firestore(),
  student: () => env.authenticatedContext('stu1', google('0191aaaa@gl.pen-kanagawa.ed.jp')).firestore(),
  student2: () => env.authenticatedContext('stu2', google('0191bbbb@gl.pen-kanagawa.ed.jp')).firestore(),
  staff: () =>
    env
      .authenticatedContext('staff1', {
        email: 'kitchen@example.com',
        firebase: { sign_in_provider: 'password' },
      })
      .firestore(),
}

const order = (uid, extra = {}) => ({
  orderNumber: 1,
  items: [{ name: 'カレーライス', price: 480, quantity: 1 }],
  total: 480,
  status: 'paid',
  paymentMethod: 'paypay',
  createdAt: 1_790_000_000_000,
  diningOption: 'eat_in',
  uid,
  ...extra,
})

/** アプリの createOrder と同じ手順（採番と注文の書き込みを 1 つのトランザクションで） */
function createOrderLikeApp(firestore, orderId, uid, extra = {}) {
  return runTransaction(firestore, async (tx) => {
    const orderRef = doc(firestore, 'orders', orderId)
    const counterRef = doc(firestore, 'dailyCounters', DAY)
    const existing = await tx.get(orderRef)
    if (existing.exists()) return existing.data().orderNumber
    const snap = await tx.get(counterRef)
    const next = (snap.data()?.count ?? 0) + 1
    tx.set(counterRef, { count: next, date: DAY }, { merge: true })
    tx.set(orderRef, order(uid, { orderNumber: next, ...extra }))
    return next
  })
}

/** ルールを通さずに下準備する */
const seed = (fn) => env.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()))

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-mealgo',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
  })
})

after(async () => {
  await env.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
  await seed((f) => setDoc(doc(f, 'staffMembers', 'staff1'), { name: '厨房' }))
})

describe('ログインしていない人・学校以外のアカウント', () => {
  const outsiders = {
    ログインなし: () => db.anon(),
    gmail: () => env.authenticatedContext('g1', google('someone@gmail.com')).firestore(),
    'メール未確認': () =>
      env.authenticatedContext('u1', google('0191cccc@gl.pen-kanagawa.ed.jp', false)).firestore(),
    '似たドメイン（後ろに付け足し）': () =>
      env.authenticatedContext('e1', google('x@gl.pen-kanagawa.ed.jp.evil.com')).firestore(),
    '似たドメイン（前に付け足し）': () =>
      env.authenticatedContext('e2', google('x@evil-gl.pen-kanagawa.ed.jp')).firestore(),
    '学校のアドレスでもパスワードで作ったアカウント': () =>
      env
        .authenticatedContext('p1', {
          email: '0191dddd@gl.pen-kanagawa.ed.jp',
          email_verified: true,
          firebase: { sign_in_provider: 'password' },
        })
        .firestore(),
  }

  for (const [name, make] of Object.entries(outsiders)) {
    it(`${name}: 注文も売り切れも読めず、注文も作れない`, async () => {
      await seed((f) => setDoc(doc(f, 'orders', 'o1'), order('stu1')))
      const f = make()
      await assertFails(getDoc(doc(f, 'orders', 'o1')))
      await assertFails(getDocs(query(collection(f, 'orders'), where('status', 'in', ['paid', 'preparing']))))
      await assertFails(getDoc(doc(f, 'dailyCounters', `soldOut-${DAY}`)))
      await assertFails(setDoc(doc(f, 'orders', 'o2'), order('stu1')))
      await assertFails(createOrderLikeApp(f, 'o3', 'g1'))
    })
  }
})

describe('学生（学校の Google アカウント）', () => {
  it('支払い後に、自分の UID を入れた注文を作れる（採番もいっしょに）', async () => {
    const f = db.student()
    await assertSucceeds(createOrderLikeApp(f, 'mp-1', 'stu1'))
    await assertSucceeds(createOrderLikeApp(f, 'mp-2', 'stu1'))
    const snap = await assertSucceeds(getDoc(doc(f, 'orders', 'mp-2')))
    if (snap.data().orderNumber !== 2) throw new Error('2 番になるはず')
  })

  it('同じ支払いIDで作り直しても、既にある注文を返すだけ（読み取りは通る）', async () => {
    const f = db.student()
    await createOrderLikeApp(f, 'mp-1', 'stu1')
    await assertSucceeds(createOrderLikeApp(f, 'mp-1', 'stu1'))
  })

  it('ほかの人の UID・支払い済み以外の状態・余計な項目の注文は作れない', async () => {
    const f = db.student()
    await assertFails(createOrderLikeApp(f, 'mp-1', 'stu2'))
    await assertFails(createOrderLikeApp(f, 'mp-2', 'stu1', { status: 'completed' }))
    await assertFails(createOrderLikeApp(f, 'mp-3', 'stu1', { refunded: true }))
    await assertFails(createOrderLikeApp(f, 'mp-4', 'stu1', { items: [] }))
    const { uid: _uid, ...noUid } = order('stu1')
    await assertFails(setDoc(doc(f, 'orders', 'mp-5'), noUid))
  })

  it('注文番号は 1 ずつしか進められない', async () => {
    const f = db.student()
    await assertFails(setDoc(doc(f, 'dailyCounters', DAY), { count: 100, date: DAY }))
    await assertSucceeds(setDoc(doc(f, 'dailyCounters', DAY), { count: 1, date: DAY }))
    await assertFails(setDoc(doc(f, 'dailyCounters', DAY), { count: 0, date: DAY }))
    await assertSucceeds(setDoc(doc(f, 'dailyCounters', DAY), { count: 2, date: DAY }))
  })

  it('注文の進み具合（自分の注文・進行中の件数）と売り切れを読める。まだない注文も見張れる', async () => {
    await seed(async (f) => {
      await setDoc(doc(f, 'orders', 'o1'), order('stu2'))
      await setDoc(doc(f, 'dailyCounters', `soldOut-${DAY}`), { items: ['curry'] })
    })
    const f = db.student()
    await assertSucceeds(getDoc(doc(f, 'orders', 'o1')))
    await assertSucceeds(getDoc(doc(f, 'orders', 'not-yet')))
    await assertSucceeds(
      getDocs(query(collection(f, 'orders'), where('status', 'in', ['paid', 'preparing']))),
    )
    await assertSucceeds(getDoc(doc(f, 'dailyCounters', `soldOut-${DAY}`)))
  })

  it('すべての注文の一覧（終わった注文・預けた中身を含む）は読めない', async () => {
    const f = db.student()
    await assertFails(getDocs(collection(f, 'orders')))
    await assertFails(getDocs(query(collection(f, 'orders'), where('status', '==', 'awaiting_payment'))))
  })

  it('注文の状態は変えられず、売り切れも切り替えられない', async () => {
    await seed((f) => setDoc(doc(f, 'orders', 'o1'), order('stu1')))
    const f = db.student()
    await assertFails(updateDoc(doc(f, 'orders', 'o1'), { status: 'completed' }))
    await assertFails(deleteDoc(doc(f, 'orders', 'o1')))
    await assertFails(
      setDoc(doc(f, 'dailyCounters', `soldOut-${DAY}`), { items: arrayUnion('curry') }, { merge: true }),
    )
  })

  it('PayPay へ移る前に預けた中身は、預けた本人だけが読み・消せる', async () => {
    const mine = db.student()
    const ref = doc(mine, 'orders', 'pending-mp-1')
    await assertSucceeds(
      setDoc(ref, { status: 'awaiting_payment', draft: { items: [], total: 0 }, createdAt: 1, uid: 'stu1' }),
    )
    await assertSucceeds(getDoc(ref))
    await assertSucceeds(getDoc(doc(mine, 'orders', 'pending-none')))

    const other = db.student2()
    await assertFails(getDoc(doc(other, 'orders', 'pending-mp-1')))
    await assertFails(deleteDoc(doc(other, 'orders', 'pending-mp-1')))
    await assertFails(
      setDoc(doc(other, 'orders', 'pending-mp-1'), {
        status: 'awaiting_payment',
        draft: {},
        createdAt: 1,
        uid: 'stu2',
      }),
    )
    await assertFails(
      setDoc(doc(other, 'orders', 'pending-mp-2'), {
        status: 'awaiting_payment',
        draft: {},
        createdAt: 1,
        uid: 'stu1',
      }),
    )

    await assertSucceeds(deleteDoc(ref))
  })

  it('スタッフの名簿に自分を書き足すことはできない', async () => {
    const f = db.student()
    await assertSucceeds(getDoc(doc(f, 'staffMembers', 'stu1')))
    await assertFails(setDoc(doc(f, 'staffMembers', 'stu1'), { name: 'わたし' }))
    await assertFails(getDoc(doc(f, 'staffMembers', 'staff1')))
    await assertFails(getDocs(collection(f, 'staffMembers')))
  })
})

describe('食堂スタッフ（staffMembers にあるアカウント）', () => {
  it('すべての注文を読み、状態を進められる（完了時刻も）', async () => {
    await seed((f) => setDoc(doc(f, 'orders', 'o1'), order('stu1')))
    const f = db.staff()
    await assertSucceeds(getDocs(collection(f, 'orders')))
    await assertSucceeds(updateDoc(doc(f, 'orders', 'o1'), { status: 'preparing' }))
    await assertSucceeds(updateDoc(doc(f, 'orders', 'o1'), { status: 'completed', completedAt: 2 }))
  })

  it('金額や品物は書き換えられず、ありえない状態にもできない。注文も作れない', async () => {
    await seed((f) => setDoc(doc(f, 'orders', 'o1'), order('stu1')))
    const f = db.staff()
    await assertFails(updateDoc(doc(f, 'orders', 'o1'), { total: 0 }))
    await assertFails(updateDoc(doc(f, 'orders', 'o1'), { status: 'refunded' }))
    await assertFails(deleteDoc(doc(f, 'orders', 'o1')))
    await assertFails(setDoc(doc(f, 'orders', 'o2'), order('staff1')))
  })

  it('売り切れを切り替えられる', async () => {
    const f = db.staff()
    const ref = doc(f, 'dailyCounters', `soldOut-${DAY}`)
    await assertSucceeds(setDoc(ref, { items: arrayUnion('curry') }, { merge: true }))
    await assertSucceeds(getDoc(ref))
    await assertFails(setDoc(ref, { items: ['curry'], note: 'x' }))
  })

  it('自分がスタッフかどうかを確かめられる', async () => {
    await assertSucceeds(getDoc(doc(db.staff(), 'staffMembers', 'staff1')))
  })

  it('名簿から外すと、すぐに何もできなくなる', async () => {
    await seed(async (f) => {
      await setDoc(doc(f, 'orders', 'o1'), order('stu1'))
      await deleteDoc(doc(f, 'staffMembers', 'staff1'))
    })
    const f = db.staff()
    await assertFails(getDocs(collection(f, 'orders')))
    await assertFails(updateDoc(doc(f, 'orders', 'o1'), { status: 'preparing' }))
  })
})
