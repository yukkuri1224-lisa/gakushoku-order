import { Navigate, Route, Routes } from 'react-router-dom'
import { GatePage } from '@/pages/GatePage'
import { MenuPage } from '@/pages/MenuPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { OrderStatusPage } from '@/pages/OrderStatusPage'
import { StaffPage } from '@/pages/StaffPage'
import { RequireGate } from '@/components/RequireGate'
import { PaymentModalHost } from '@/components/PaymentModalHost'
import { GATE_KEY } from '@/lib/gate'

export default function App() {
  return (
    <div className="min-h-full bg-white text-gray-900">
      <Routes>
        <Route path="/" element={<GatePage />} />
        <Route
          path="/menu"
          element={
            <RequireGate flag={GATE_KEY} redirectTo="/">
              <MenuPage />
            </RequireGate>
          }
        />
        <Route
          path="/checkout"
          element={
            <RequireGate flag={GATE_KEY} redirectTo="/">
              <CheckoutPage />
            </RequireGate>
          }
        />
        <Route path="/order/:orderId" element={<OrderStatusPage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* PayPay 風モック決済モーダルを常設 */}
      <PaymentModalHost />
    </div>
  )
}
