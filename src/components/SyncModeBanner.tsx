import { syncMode } from '@/lib/orders'

// Firebase 未設定でローカル同期にフォールバックしているときだけ注意書きを表示。
export function SyncModeBanner() {
  if (syncMode === 'firestore') return null
  return (
    <div className="mb-3 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      <span aria-hidden>💡</span>
      <span>
        ローカル簡易同期モードで動作中（Firebase
        未設定）。同一PCの別タブ間でのみ同期します。端末をまたぐ同期には Firebase
        設定が必要です。
      </span>
    </div>
  )
}
