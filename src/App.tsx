import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { GatePage } from '@/pages/GatePage'
import { DiningPage } from '@/pages/DiningPage'
import { MenuPage } from '@/pages/MenuPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { OrderStatusPage } from '@/pages/OrderStatusPage'
import { StaffPage } from '@/pages/StaffPage'
import { RequireLogin } from '@/components/RequireLogin'
import { RequireDining } from '@/components/RequireDining'
import { PaymentModalHost } from '@/components/PaymentModalHost'
import { Toast } from '@/components/Toast'
import { PendingPaymentWatcher } from '@/components/PendingPaymentWatcher'
import { DesktopQrPanel } from '@/components/DesktopQrPanel'

export default function App() {
  return (
    <div className="min-h-dvh bg-cream text-ink">
      <Routes>
        <Route path="/" element={<GatePage />} />
        <Route
          path="/start"
          element={
            <RequireLogin>
              <DiningPage />
            </RequireLogin>
          }
        />
        <Route
          path="/menu"
          element={
            <RequireLogin>
              <RequireDining>
                <MenuPage />
              </RequireDining>
            </RequireLogin>
          }
        />
        <Route path="/checkout" element={<CheckoutRoute />} />
        <Route path="/order/:orderId" element={<OrderStatusPage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* PayPay 風モック決済モーダルを常設 */}
      <PaymentModalHost />
      <Toast />
      {/* PayPay の支払い後、別のブラウザで注文ができたらこの画面も注文番号へ */}
      <PendingPaymentWatcher />
      {/* パソコンで開いたときは、スマホで開くための QR コードを横に出す */}
      <DesktopQrPanel />
    </div>
  )
}

// 注文内容の確認。ただし PayPay の支払いページから戻ってきたとき（?pp=return）は、
// 合言葉・ログインなしで開く。スマホでは PayPay アプリから「ふだんのブラウザ」に戻ることがあり、
// そこで入口に戻すと、支払ったのに注文が登録されないため（この画面は支払いの確認と注文の登録だけを行う）。
function CheckoutRoute() {
  const { search } = useLocation()
  if (new URLSearchParams(search).get('pp') === 'return') return <CheckoutPage />
  return (
    <RequireLogin>
      <CheckoutPage />
    </RequireLogin>
  )
}
