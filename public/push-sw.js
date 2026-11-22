// 調理完了の通知を表示する（Workbox が作る sw.js から importScripts で読み込む。vite.config.ts）。
// サーバー（/api/notify）は data に title・body・url・tag を入れて送る。
self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch (e) {
    payload = {}
  }
  const d = payload.data || payload
  event.waitUntil(
    self.registration.showNotification(d.title || 'mealgo', {
      body: d.body || '',
      icon: '/icon-192.png',
      badge: '/favicon-48.png',
      tag: d.tag || 'mealgo',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: d.url || '/' },
    }),
  )
})

// 通知を押したら、その注文の画面を開く（開いている画面があればそれを使う）
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const w of windows) {
        if ('focus' in w) {
          await w.focus()
          if ('navigate' in w) await w.navigate(url).catch(() => {})
          return
        }
      }
      await self.clients.openWindow(url)
    })(),
  )
})
