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
  /** サムネイルの背景グラデーション（Tailwind のクラスを丸ごと指定） */
  tint: string
  /** 任意: 料理写真の URL（指定時は絵文字より優先） */
  image?: string
  /** 任意: ひとことキャッチ */
  tagline?: string
}

export const MENU: MenuItem[] = [
  {
    id: 'ramen',
    name: '醤油ラーメン',
    price: 450,
    emoji: '🍜',
    tint: 'bg-gradient-to-br from-amber-200 to-orange-400',
    tagline: '定番の一杯',
  },
  {
    id: 'curry',
    name: 'カレーライス',
    price: 480,
    emoji: '🍛',
    tint: 'bg-gradient-to-br from-yellow-200 to-amber-500',
    tagline: 'スパイス香る',
  },
  {
    id: 'karaage',
    name: '唐揚げ定食',
    price: 550,
    emoji: '🍗',
    tint: 'bg-gradient-to-br from-orange-200 to-rose-400',
    tagline: 'ボリューム満点',
  },
  {
    id: 'udon',
    name: 'きつねうどん',
    price: 380,
    emoji: '🍲',
    tint: 'bg-gradient-to-br from-lime-200 to-emerald-400',
    tagline: 'やさしい出汁',
  },
  {
    id: 'gyudon',
    name: '牛丼',
    price: 490,
    emoji: '🐮',
    tint: 'bg-gradient-to-br from-rose-200 to-red-400',
    tagline: 'がっつり',
  },
  {
    id: 'omurice',
    name: 'オムライス',
    price: 520,
    emoji: '🍳',
    tint: 'bg-gradient-to-br from-amber-200 to-yellow-400',
    tagline: 'ふわとろ',
  },
  {
    id: 'salad',
    name: 'サラダ',
    price: 200,
    emoji: '🥗',
    tint: 'bg-gradient-to-br from-green-200 to-teal-400',
    tagline: 'ヘルシー',
  },
  {
    id: 'coffee',
    name: 'アイスコーヒー',
    price: 150,
    emoji: '☕',
    tint: 'bg-gradient-to-br from-stone-300 to-amber-700',
    tagline: '食後に',
  },
]
