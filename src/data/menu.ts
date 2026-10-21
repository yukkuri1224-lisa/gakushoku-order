// デモ用メニュー定数。
// ▼本番化の差し替えポイント（メニュー供給元）:
//   メニューはここのコード内定数で持つ（Firestore からは取得しない）。
//   将来 CMS や管理画面から取得したい場合は、この配列を返す関数に置き換える。
//
//   選択肢（サイズ・トッピングなど）は optionGroups に「1つ選ぶ」グループとして持つ。
//   どのグループも defaultChoiceId が最初から選ばれている。

export interface OptionChoice {
  id: string
  label: string
  priceDelta: number // 基本価格への加算（円）
}

export interface OptionGroup {
  id: string
  label: string
  required: boolean // 画面に「必須」ラベルを出すか
  defaultChoiceId: string
  choices: OptionChoice[]
}

export interface MenuItem {
  id: string
  name: string
  price: number // 基本価格（円）
  category: string
  description?: string
  image?: string
  optionGroups?: OptionGroup[]
}

const SIZE: OptionGroup = {
  id: 'size',
  label: 'サイズ',
  required: true,
  defaultChoiceId: 'regular',
  choices: [
    { id: 'regular', label: '普通', priceDelta: 0 },
    { id: 'large', label: '大盛り', priceDelta: 150 },
  ],
}

const FUKUJINZUKE: OptionGroup = {
  id: 'fukujinzuke',
  label: '福神漬け',
  required: false,
  defaultChoiceId: 'with',
  choices: [
    { id: 'with', label: 'つける', priceDelta: 0 },
    { id: 'without', label: 'つけない', priceDelta: 0 },
  ],
}

/** カテゴリの表示順 */
export const MENU_CATEGORIES: string[] = ['麺類', 'ご飯もの']

export const MENU: MenuItem[] = [
  {
    id: 'ramen',
    name: '醤油ラーメン',
    price: 430,
    category: '麺類',
    description: 'あっさり醤油スープの定番',
    image: '/menu/ramen.jpg',
    optionGroups: [SIZE],
  },
  {
    id: 'curry',
    name: 'カレーライス',
    price: 480,
    category: 'ご飯もの',
    description: '程よい辛さのごろっと具材',
    image: '/menu/curry.jpg',
    optionGroups: [SIZE, FUKUJINZUKE],
  },
]
