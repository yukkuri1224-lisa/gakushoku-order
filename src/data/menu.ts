// デモ用メニュー定数（LiSA校食堂の掲示「Basic MENU」「軽食メニュー」より）。
// ▼本番化の差し替えポイント（メニュー供給元）:
//   メニューはここのコード内定数で持つ（Firestore からは取得しない）。
//   将来 CMS や管理画面から取得したい場合は、この配列を返す関数に置き換える。
//
//   選択肢（サイズ・トッピングなど）は optionGroups に「1つ選ぶ」グループとして持つ。
//   defaultChoiceId のあるグループは最初から選ばれている。無いグループ（うどん／そば）は
//   毎回お客さんが選ぶまでカートに入れられない。

export interface OptionChoice {
  id: string
  label: string
  priceDelta: number // 基本価格への加算（円）
  summaryLabel?: string // カート・厨房での表示名（省略時は label）。例: 福神漬けなし
}

export interface OptionGroup {
  id: string
  label: string
  required: boolean // 画面に「必須」ラベルを出すか
  defaultChoiceId?: string // 省略時は初期値なし（毎回選ぶ）
  choices: OptionChoice[]
}

export interface MenuItem {
  id: string
  name: string
  price: number // 基本価格（円）
  category: string
  description?: string
  image?: string
  unit?: string // 価格の単位（例: 1こ）。一覧・商品シートで価格の後ろに出す
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

const NOODLE: OptionGroup = {
  id: 'noodle',
  label: '麺',
  required: true,
  choices: [
    { id: 'udon', label: 'うどん', priceDelta: 0 },
    { id: 'soba', label: 'そば', priceDelta: 0 },
  ],
}

const FUKUJINZUKE: OptionGroup = {
  id: 'fukujinzuke',
  label: '福神漬け',
  required: false,
  defaultChoiceId: 'with',
  choices: [
    { id: 'with', label: 'つける', priceDelta: 0, summaryLabel: '福神漬けあり' },
    { id: 'without', label: 'つけない', priceDelta: 0, summaryLabel: '福神漬けなし' },
  ],
}

/** ジャンルの表示順（メニュー画面の絞り込みもこの順） */
export const MENU_CATEGORIES: string[] = ['定食', '麺類', 'カレー', '軽食']

export const MENU: MenuItem[] = [
  // 定食
  {
    id: 'lunch_a',
    name: 'ランチA',
    price: 510,
    category: '定食',
    description: '日替わりの定食',
    optionGroups: [SIZE],
  },
  {
    id: 'lunch_b',
    name: 'ランチB',
    price: 530,
    category: '定食',
    description: '日替わりの定食',
    optionGroups: [SIZE],
  },
  {
    id: 'lunch_c',
    name: 'ランチC',
    price: 560,
    category: '定食',
    description: '日替わりの定食',
    optionGroups: [SIZE],
  },
  {
    id: 'dinner_set',
    name: '夕定食',
    price: 490,
    category: '定食',
    description: '夕方の定食（大盛りはありません）',
  },

  // 麺類
  {
    id: 'ramen',
    name: '醤油ラーメン',
    price: 430,
    category: '麺類',
    description: 'あっさり醤油スープの定番',
    image: '/menu/illust/ramen.jpg',
    optionGroups: [SIZE],
  },
  {
    id: 'wonton_ramen',
    name: 'ワンタンラーメン',
    price: 430,
    category: '麺類',
    description: 'つるんとしたワンタン入り',
    image: '/menu/illust/wonton_ramen.jpg',
    optionGroups: [SIZE],
  },
  {
    id: 'kake',
    name: 'かけうどん・そば',
    price: 340,
    category: '麺類',
    description: 'だしのきいたシンプルな一杯',
    optionGroups: [NOODLE, SIZE],
  },
  {
    id: 'wakame',
    name: 'わかめうどん・そば',
    price: 390,
    category: '麺類',
    description: 'わかめをたっぷりのせて',
    image: '/menu/illust/wakame.jpg',
    optionGroups: [NOODLE, SIZE],
  },
  {
    id: 'tanuki',
    name: 'たぬきうどん・そば',
    price: 390,
    category: '麺類',
    description: '天かすとねぎをのせて',
    image: '/menu/illust/tanuki.jpg',
    optionGroups: [NOODLE, SIZE],
  },
  {
    id: 'kitsune',
    name: 'きつねうどん・そば',
    price: 420,
    category: '麺類',
    description: '甘く煮たおあげをのせて',
    optionGroups: [NOODLE, SIZE],
  },
  {
    id: 'curry_noodle',
    name: 'カレーうどん・そば',
    price: 450,
    category: '麺類',
    description: 'だしのきいたカレーつゆで',
    optionGroups: [NOODLE, SIZE],
  },

  // カレー
  {
    id: 'curry',
    name: 'カレーライス',
    price: 480,
    category: 'カレー',
    description: '程よい辛さのごろっと具材',
    optionGroups: [SIZE, FUKUJINZUKE],
  },
  {
    id: 'katsu_curry',
    name: 'カツカレー',
    price: 580,
    category: 'カレー',
    description: 'サクサクのカツをのせて',
    optionGroups: [SIZE, FUKUJINZUKE],
  },
  {
    id: 'karaage_curry',
    name: '唐揚カレー',
    price: 580,
    category: 'カレー',
    description: 'から揚げをのせて',
    image: '/menu/illust/karaage_curry.jpg',
    optionGroups: [SIZE, FUKUJINZUKE],
  },

  // 軽食
  { id: 'takoyaki', name: 'たこ焼き', price: 270, category: '軽食' },
  { id: 'hamkatsu', name: 'ハムカツ', price: 150, category: '軽食' },
  { id: 'yakisoba', name: '焼きそば', price: 270, category: '軽食' },
  { id: 'kaori_age', name: '若鶏の香り揚げ', price: 230, category: '軽食', unit: '1こ' },
  { id: 'karaage', name: 'から揚げ', price: 180, category: '軽食', unit: '1こ' },
  {
    id: 'manzoku_croquette',
    name: 'まんぞくコロッケ',
    price: 150,
    category: '軽食',
    unit: '1こ',
  },
  { id: 'croquette', name: 'コロッケ', price: 80, category: '軽食', unit: '1こ' },
  { id: 'hash_potato', name: 'ハッシュドポテト', price: 150, category: '軽食', unit: '1こ' },
  { id: 'fries', name: 'フライドポテト', price: 180, category: '軽食' },
]
