// 時間帯のあいさつ（最初の画面の見出し用）。
export function greeting(d: Date = new Date()): string {
  const h = d.getHours()
  if (h >= 5 && h < 11) return 'おはようございます'
  if (h >= 11 && h < 18) return 'こんにちは'
  return 'こんばんは'
}
