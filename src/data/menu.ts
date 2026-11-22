// デモ用メニュー定数（LiSA校食堂の掲示「Basic MENU」「軽食メニュー」より）。
// 画像は public/menu/illust（いただいたイラスト）と public/menu/irasutoya（いらすとや）。どちらもイメージ。
// ▼メニューの供給元:
//   ここの MENU は「はじめから入っているメニュー」。食堂がメニュー管理（厨房ボードの「メニュー」）で
//   保存すると Firestore の menuItems に移り、以後はそちらを使う（src/lib/menu, src/store/menu.ts）。
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
  image?: string // 画像はイメージ（いただいたイラスト、またはいらすとや）
  badge?: string // 画像に重ねる小さなラベル（例: 日替わり）
  unit?: string // 価格の単位（例: 1こ）。一覧・商品シートで価格の後ろに出す
  yomi?: string // 検索用の読み（ひらがな）。「からあげ」で「唐揚カレー」も見つかるように
  optionGroups?: OptionGroup[]
  hidden?: boolean // 食堂が「表示しない」にした商品（学生のメニューに出さない）
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

const NEGI: OptionGroup = {
  id: 'negi',
  label: 'ネギ',
  required: false,
  defaultChoiceId: 'with',
  choices: [
    { id: 'with', label: 'あり', priceDelta: 0, summaryLabel: 'ネギあり' },
    { id: 'without', label: '抜き', priceDelta: 0, summaryLabel: 'ネギ抜き' },
  ],
}

/** 食堂のメニュー管理で付け外しできる選択肢（この順に並ぶ） */
export const OPTION_PRESETS: OptionGroup[] = [NOODLE, SIZE, NEGI, FUKUJINZUKE]

/** ホットスナック（券売機とは別の枠。メニュー画面でも別のタブで出す） */
export const HOT_SNACK = 'ホットスナック'

/** 食堂メニュー（券売機の料理）のジャンル。メニュー画面の絞り込みもこの順 */
export const MEAL_CATEGORIES: string[] = ['定食', '麺類', 'カレー']

/** すべてのジャンルの表示順（売り切れの切り替えなど） */
export const MENU_CATEGORIES: string[] = [...MEAL_CATEGORIES, HOT_SNACK]

export function isHotSnack(item: Pick<MenuItem, 'category'>): boolean {
  return item.category === HOT_SNACK
}

const IMG = '/menu/irasutoya'
const ILLUST = '/menu/illust'

/** メニュー管理で選べる画像（public/menu にあるもの） */
export const MENU_IMAGES: string[] = [
  ...['set_meal', 'kake', 'kitsune', 'curry_noodle', 'curry', 'katsu_curry', 'takoyaki', 'hamkatsu',
    'yakisoba', 'kaori_age', 'karaage', 'manzoku_croquette', 'croquette', 'hash_potato', 'fries'].map(
    (n) => `${IMG}/${n}.jpg`,
  ),
  ...['ramen', 'wonton_ramen', 'wakame', 'tanuki', 'karaage_curry'].map((n) => `${ILLUST}/${n}.jpg`),
]

export const MENU: MenuItem[] = [
  // 定食（中身は日によって変わるため説明は書かない。画像は定食のイメージ）
  {
    id: 'lunch_a',
    name: 'ランチA',
    yomi: 'らんちえー',
    price: 510,
    category: '定食',
    image: `${IMG}/set_meal.jpg`,
    optionGroups: [SIZE],
  },
  {
    id: 'lunch_b',
    name: 'ランチB',
    yomi: 'らんちびー',
    price: 530,
    category: '定食',
    image: `${IMG}/set_meal.jpg`,
    optionGroups: [SIZE],
  },
  {
    id: 'lunch_c',
    name: 'ランチC',
    yomi: 'らんちしー',
    price: 560,
    category: '定食',
    image: `${IMG}/set_meal.jpg`,
    optionGroups: [SIZE],
  },
  {
    id: 'dinner_set',
    name: '夕定食',
    yomi: 'ゆうていしょく',
    price: 490,
    category: '定食',
    image: `${IMG}/set_meal.jpg`,
  },

  // 麺類
  {
    id: 'ramen',
    name: 'ラーメン',
    yomi: 'らーめん',
    price: 430,
    category: '麺類',
    description: '日替わりで味が変わります',
    image: `${ILLUST}/ramen.jpg`,
    badge: '日替わり',
    optionGroups: [SIZE, NEGI],
  },
  {
    id: 'wonton_ramen',
    name: 'ワンタンラーメン',
    yomi: 'わんたんらーめん',
    price: 430,
    category: '麺類',
    description: 'つるんとしたワンタン入り',
    image: `${ILLUST}/wonton_ramen.jpg`,
    optionGroups: [SIZE, NEGI],
  },
  {
    id: 'kake',
    name: 'かけうどん・そば',
    yomi: 'かけうどん・そば',
    price: 340,
    category: '麺類',
    description: 'だしのきいたシンプルな一杯',
    image: `${IMG}/kake.jpg`,
    optionGroups: [NOODLE, SIZE, NEGI],
  },
  {
    id: 'wakame',
    name: 'わかめうどん・そば',
    yomi: 'わかめうどん・そば',
    price: 390,
    category: '麺類',
    description: 'わかめをたっぷりのせて',
    image: `${ILLUST}/wakame.jpg`,
    optionGroups: [NOODLE, SIZE, NEGI],
  },
  {
    id: 'tanuki',
    name: 'たぬきうどん・そば',
    yomi: 'たぬきうどん・そば',
    price: 390,
    category: '麺類',
    description: '天かすとねぎをのせて',
    image: `${ILLUST}/tanuki.jpg`,
    optionGroups: [NOODLE, SIZE, NEGI],
  },
  {
    id: 'kitsune',
    name: 'きつねうどん・そば',
    yomi: 'きつねうどん・そば',
    price: 420,
    category: '麺類',
    description: '甘く煮たおあげをのせて',
    image: `${IMG}/kitsune.jpg`,
    optionGroups: [NOODLE, SIZE, NEGI],
  },
  {
    id: 'curry_noodle',
    name: 'カレーうどん・そば',
    yomi: 'かれーうどん・そば',
    price: 450,
    category: '麺類',
    description: 'だしのきいたカレーつゆで',
    image: `${IMG}/curry_noodle.jpg`,
    optionGroups: [NOODLE, SIZE, NEGI],
  },

  // カレー
  {
    id: 'curry',
    name: 'カレーライス',
    yomi: 'かれーらいす',
    price: 480,
    category: 'カレー',
    description: '程よい辛さのごろっと具材',
    image: `${IMG}/curry.jpg`,
    optionGroups: [SIZE, FUKUJINZUKE],
  },
  {
    id: 'katsu_curry',
    name: 'カツカレー',
    yomi: 'かつかれー',
    price: 580,
    category: 'カレー',
    description: 'サクサクのカツをのせて',
    image: `${IMG}/katsu_curry.jpg`,
    optionGroups: [SIZE, FUKUJINZUKE],
  },
  {
    id: 'karaage_curry',
    name: '唐揚カレー',
    yomi: 'からあげかれー',
    price: 580,
    category: 'カレー',
    description: 'から揚げをのせて',
    image: `${ILLUST}/karaage_curry.jpg`,
    optionGroups: [SIZE, FUKUJINZUKE],
  },

  // ホットスナック（掲示の「軽食メニュー」）
  { id: 'takoyaki', name: 'たこ焼き', yomi: 'たこやき', price: 270, category: HOT_SNACK, image: `${IMG}/takoyaki.jpg` },
  { id: 'hamkatsu', name: 'ハムカツ', yomi: 'はむかつ', price: 150, category: HOT_SNACK, image: `${IMG}/hamkatsu.jpg` },
  { id: 'yakisoba', name: '焼きそば', yomi: 'やきそば', price: 270, category: HOT_SNACK, image: `${IMG}/yakisoba.jpg` },
  {
    id: 'kaori_age',
    name: '若鶏の香り揚げ',
    yomi: 'わかどりのかおりあげ',
    price: 230,
    category: HOT_SNACK,
    image: `${IMG}/kaori_age.jpg`,
    unit: '1個',
  },
  {
    id: 'karaage',
    name: 'から揚げ',
    yomi: 'からあげ',
    price: 180,
    category: HOT_SNACK,
    image: `${IMG}/karaage.jpg`,
    unit: '1個',
  },
  {
    id: 'manzoku_croquette',
    name: 'まんぞくコロッケ',
    yomi: 'まんぞくころっけ',
    price: 150,
    category: HOT_SNACK,
    image: `${IMG}/manzoku_croquette.jpg`,
    unit: '1個',
  },
  {
    id: 'croquette',
    name: 'コロッケ',
    yomi: 'ころっけ',
    price: 80,
    category: HOT_SNACK,
    image: `${IMG}/croquette.jpg`,
    unit: '1個',
  },
  {
    id: 'hash_potato',
    name: 'ハッシュドポテト',
    yomi: 'はっしゅどぽてと',
    price: 150,
    category: HOT_SNACK,
    image: `${IMG}/hash_potato.jpg`,
    unit: '1個',
  },
  { id: 'fries', name: 'フライドポテト', yomi: 'ふらいどぽてと', price: 180, category: HOT_SNACK, image: `${IMG}/fries.jpg` },
]
