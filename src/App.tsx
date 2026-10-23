import { Navigate, Route, Routes } from 'react-router-dom'
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
        <Route
          path="/checkout"
          element={
            <RequireLogin>
              <CheckoutPage />
            </RequireLogin>
          }
        />
        <Route path="/order/:orderId" element={<OrderStatusPage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* PayPay 風モック決済モーダルを常設 */}
      <PaymentModalHost />
      <Toast />
    </div>
  )
}
