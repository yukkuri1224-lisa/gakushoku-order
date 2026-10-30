import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { installSoundUnlock } from './lib/sound'
import { captureInstallPrompt } from './lib/install'
import { registerSW } from 'virtual:pwa-register'
import './index.css'

// 最初のタップで通知音の準備をする（ブラウザはタップ前のページから音を出させない）
installSoundUnlock()
// 「ホーム画面に追加」の合図を受け取っておく（Android の Chrome など）
captureInstallPrompt()
// 新しい版を公開したら、開いている画面も自動で新しい版に読み込み直す（古い画面が残らないように）。
// 厨房ボードのように開いたままの画面のため、1 時間ごとにも新しい版がないか確かめる。
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (registration) setInterval(() => void registration.update(), 60 * 60 * 1000)
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
