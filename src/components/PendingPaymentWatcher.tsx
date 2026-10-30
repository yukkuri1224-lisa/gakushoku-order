import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getOrderRepository } from '@/lib/orders'
import { clearPendingPayPayId, confirmPayPayPayment, getPendingPayPayId } from '@/lib/payment'
import { rememberOrder } from '@/lib/myOrders'
import { registerPaidOrder } from '@/lib/registerPaidOrder'
import { useCartStore } from '@/store/cart'

// PayPay で支払い中の注文を見張る（App に常設）。
// スマホでは PayPay アプリから「ふだんのブラウザ」に戻り、そちらで注文ができることがある。
//   - その注文ができたら、注文を始めたこの画面（ホーム画面のアプリなど）でもカートを空にし、注文番号へ進む。
//   - この画面に戻ってきたとき支払いが済んでいて、まだ注文がなければ、この画面で注文を作る
//     （戻った先のブラウザで作れなかった場合にそなえる。同じ支払いIDなので注文は1件にまとまる）。
export function PendingPaymentWatcher() {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  // 支払いページから戻ってきた直後（/checkout?pp=return）は注文確認画面が登録するので、ここでは作らない
  const returningHere = pathname === '/checkout' && new URLSearchParams(search).get('pp') === 'return'
  const [pendingId, setPendingId] = useState(() => getPendingPayPayId())

  // 画面を移ったとき・アプリに戻ってきたときに読み直す
  useEffect(() => {
    setPendingId(getPendingPayPayId())
  }, [pathname])
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') setPendingId(getPendingPayPayId())
    }
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('pageshow', refresh)
    return () => {
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('pageshow', refresh)
    }
  }, [])

  useEffect(() => {
    if (!pendingId) return
    return getOrderRepository().subscribeOrder(pendingId, (order) => {
      if (!order) return
      rememberOrder(order.id, order.createdAt)
      useCartStore.getState().clear()
      clearPendingPayPayId()
      setPendingId(null)
      navigate(`/order/${order.id}`, { replace: true })
    })
  }, [pendingId, navigate])

  useEffect(() => {
    if (!pendingId || returningHere) return
    let cancelled = false
    void (async () => {
      const paid = await confirmPayPayPayment(pendingId).catch(() => false)
      if (!paid || cancelled) return
      // 注文ができると、上の見張りがカートを空にして注文番号へ進む
      await registerPaidOrder(pendingId, 'paypay').catch((e) =>
        console.warn('支払い済みの注文を登録できませんでした', e),
      )
    })()
    return () => {
      cancelled = true
    }
  }, [pendingId, returningHere])

  return null
}
