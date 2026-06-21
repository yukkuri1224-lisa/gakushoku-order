// Vercel Serverless Function: PayPay 決済の作成（サンドボックス対応）
//   POST /api/paypay/create  body: { amount: number }
//   → PayPay の決済ページ URL と merchantPaymentId を返す
//
// 秘密情報（API_SECRET）はサーバー側でのみ使用する。環境変数は VITE_ を付けない
// （付けるとブラウザに露出するため）。Vercel の Environment Variables に設定する:
//   PAYPAY_API_KEY / PAYPAY_API_SECRET / PAYPAY_MERCHANT_ID
//
// ※ローカルの `npm run dev`（Vite）では /api は動きません。Vercel 上、または
//   `vercel dev` で動作します。デモのローカル確認は VITE_PAYMENT_MODE=mock のままで。
import PAYPAY from '@paypayopa/paypayopa-sdk-node'
import crypto from 'node:crypto'

PAYPAY.Configure({
  env: 'STAGING', // サンドボックス。本番は 'PROD'
  clientId: process.env.PAYPAY_API_KEY,
  clientSecret: process.env.PAYPAY_API_SECRET,
  merchantId: process.env.PAYPAY_MERCHANT_ID,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }
  if (!process.env.PAYPAY_API_KEY || !process.env.PAYPAY_API_SECRET) {
    res
      .status(500)
      .json({ error: 'PayPay の認証情報（環境変数）が設定されていません' })
    return
  }

  try {
    const amount = Number(req.body?.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ error: 'amount が不正です' })
      return
    }

    const merchantPaymentId = crypto.randomUUID()
    const origin = req.headers.origin || `https://${req.headers.host}`
    // 支払い後に戻ってくる先（CheckoutPage が pp=return を見て確認処理を行う）
    const redirectUrl = `${origin}/checkout?pp=return&mpid=${merchantPaymentId}`

    const payload = {
      merchantPaymentId,
      amount: { amount, currency: 'JPY' },
      codeType: 'ORDER_QR',
      orderDescription: '学食モバイルオーダー',
      redirectUrl,
      redirectType: 'WEB_LINK',
    }

    const response = await PAYPAY.QRCodeCreate(payload)
    const url = response?.BODY?.data?.url
    if (!url) {
      res.status(502).json({
        error: 'PayPay の決済URLを取得できませんでした',
        detail: response?.BODY?.resultInfo ?? null,
      })
      return
    }

    res.status(200).json({ url, merchantPaymentId })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'PayPay エラー' })
  }
}
