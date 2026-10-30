import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { GatePage } from '@/pages/GatePage'
import { DiningPage } from '@/pages/DiningPage'
import { MenuPage } from '@/pages/MenuPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { OrderStatusPage } from '@/pages/OrderStatusPage'
import { StaffPage } from '@/pages/StaffPage'
import { RequireLogin, RequireSchoolAccount, WhenStudent } from '@/components/RequireLogin'
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
        <Route
          path="/order/:orderId"
          element={
            <RequireSchoolAccount>
              <OrderStatusPage />
            </RequireSchoolAccount>
          }
        />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* PayPay 風モック決済モーダルを常設 */}
      <PaymentModalHost />
      <Toast />
      {/* PayPay の支払い後、別のブラウザで注文ができたらこの画面も注文番号へ */}
      <WhenStudent>
        <PendingPaymentWatcher />
      </WhenStudent>
      {/* パソコンで開いたときは、スマホで開くための QR コードを横に出す */}
      <DesktopQrPanel />
    </div>
  )
}

// 注文内容の確認。ただし PayPay の支払いページから戻ってきたとき（?pp=return）は、
// 入口に戻さずにこの画面のまま開く。スマホでは PayPay アプリから「ふだんのブラウザ」に戻ることがあり、
// そこで入口に戻すと、支払ったのに注文が登録されないため（この画面は支払いの確認と注文の登録だけを行う）。
// 合言葉のデモでは合言葉なしで開く。アカウントでのログインでは、その場でログインしてもらってから登録する
// （データベースが、学校のアカウントでログインした人の注文しか受け付けないため）。
function CheckoutRoute() {
  const { search } = useLocation()
  if (new URLSearchParams(search).get('pp') === 'return') {
    return (
      <RequireSchoolAccount notice="PayPay から戻りました。学校のアカウントでログインすると、注文の登録を続けます（もう一度支払う必要はありません）。">
        <CheckoutPage />
      </RequireSchoolAccount>
    )
  }
  return (
    <RequireLogin>
      <CheckoutPage />
    </RequireLogin>
  )
}
