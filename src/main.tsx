import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { installSoundUnlock } from './lib/sound'
import { captureInstallPrompt } from './lib/install'
import './index.css'

// 最初のタップで通知音の準備をする（ブラウザはタップ前のページから音を出させない）
installSoundUnlock()
// 「ホーム画面に追加」の合図を受け取っておく（Android の Chrome など）
captureInstallPrompt()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
