// デモ用メニュー定数。
// ▼本番化の差し替えポイント（メニュー供給元）:
//   メニューはここのコード内定数で持つ（Firestore からは取得しない）。
//   将来 CMS や管理画面から取得したい場合は、この配列を返す関数に置き換える。
//
//   画像を使いたい場合は image に URL を入れると、絵文字の代わりに写真を表示します。
//   （未指定なら tint のグラデーション＋絵文字サムネイル）

export interface MenuItem {
  id: string
  name: string
  price: number
  emoji: string
  tint: string
  image?: string
  tagline?: string
}

export const MENU: MenuItem[] = [
  {
    id: 'ramen',
    name: 'ラーメン',
    price: 430,
    tagline: '定番の一杯',
  },
  {
    id: 'curry',
    name: 'カレーライス',
    price: 480,
    tagline: 'スパイス香る',
  },
]
