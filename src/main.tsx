import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { installSoundUnlock } from './lib/sound'
import './index.css'

// 最初のタップで通知音の準備をする（ブラウザはタップ前のページから音を出させない）
installSoundUnlock()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
