// Vercel Serverless Function: PayPay 支払い状況の確認
//   GET /api/paypay/status?merchantPaymentId=xxx  (mpid= でも可)
//   → { status: "COMPLETED" | "CREATED" | ... } を返す
import PAYPAY from '@paypayopa/paypayopa-sdk-node'

PAYPAY.Configure({
  env: 'STAGING',
  clientId: process.env.PAYPAY_API_KEY,
  clientSecret: process.env.PAYPAY_API_SECRET,
  merchantId: process.env.PAYPAY_MERCHANT_ID,
})

export default async function handler(req, res) {
  if (!process.env.PAYPAY_API_KEY || !process.env.PAYPAY_API_SECRET) {
    res
      .status(500)
      .json({ error: 'PayPay の認証情報（環境変数）が設定されていません' })
    return
  }

  const merchantPaymentId = req.query.merchantPaymentId || req.query.mpid
  if (!merchantPaymentId) {
    res.status(400).json({ error: 'merchantPaymentId が必要です' })
    return
  }

  try {
    // GetCodePaymentDetails は配列で merchantPaymentId を渡す
    const response = await PAYPAY.GetCodePaymentDetails([merchantPaymentId])
    const status = response?.BODY?.data?.status ?? 'UNKNOWN'
    res.status(200).json({ status })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'PayPay エラー' })
  }
}
