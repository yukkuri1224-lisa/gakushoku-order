# 学食モバイルオーダー 画面リニューアル Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 画面を本格的なモバイルオーダーの見た目に作り直し、メニューの選択肢（大盛り・福神漬け）と、支払い後の注文登録の再試行・二重登録防止を入れる。

**Architecture:** 既存の Vite + React + Tailwind + zustand 構成を維持。選択肢の計算は副作用のない関数（`src/lib/menuOptions.ts`）に集め、単体テストする。画面は小さな部品（ヘッダー、商品行、商品シート、選択肢グループ）に分けて組み直す。注文作成は支払いIDをドキュメントIDにして1トランザクションで冪等にする。

**Tech Stack:** Vite 5, React 18, TypeScript, Tailwind 3, zustand 5, Firebase 11, Vitest（追加）, jsdom（追加）

**Spec:** `docs/superpowers/specs/2026-10-21-mobile-order-redesign-design.md`

## Global Constraints

- 色は設計書の表の値のみ: 白 `#FFFFFF`, 薄灰 `#F5F5F4`, 墨 `#1C1917`, 補助 `#57534E`, 薄文字 `#A8A29E`, 線 `#E7E5E4`, アクセント地 `#FDF3D7` / 文字 `#7A5300`, 注意 `#B42318`, 完了 `#15803D`, PayPay `#FF0033`
- 太さは `font-normal` / `font-bold` のみ。`font-black` / `font-extrabold` を使わない
- 角丸 8px（`rounded-lg`）。影はシートと最下部固定バーのみ
- 絵文字を UI に使わない（アイコンはインライン SVG）
- メインボタン高さ 52px、押せる要素 44px 以上
- 文言はすべて日本語。価格表示は `¥1,234` 形式
- 既存の PayPay 処理（`api/paypay/*`, `src/lib/payment/*`）と `firestore.rules` は変更しない

## Review Focus

1. 旧バージョンで localStorage に残ったカート（`key` / `options` のない行）→ そのまま表示・数量変更・削除できること（Task 2 にテスト）
2. PayPay の戻りURLを再読み込み／再試行 → 注文が2件にならず、同じ注文番号に着くこと（Task 3 にテスト）
3. 既存 Firestore の注文（`options` なし）→ 注文番号画面・厨房ボードで落ちずに「選択肢なし」で出ること（Task 1 にテスト）
4. 商品シートで選択肢と数量を変えたときの金額 → (基本価格 + 差額) × 数量（Task 1 にテスト）
5. 同じ組み合わせを2回追加 → 1行で数量2、違う組み合わせ → 別行（Task 2 にテスト）

---

### Task 1: 選択肢のデータ型・メニュー定義・計算関数

**Files:**
- Modify: `src/data/menu.ts`, `src/types/order.ts`, `package.json`
- Create: `src/lib/menuOptions.ts`, `src/lib/menuOptions.test.ts`, `vitest.config.ts`

**Interfaces:**
- Produces（`src/data/menu.ts`）: `OptionChoice`, `OptionGroup`, `MenuItem`（設計書2章の型そのまま）, `MENU: MenuItem[]`, `MENU_CATEGORIES: string[]`（表示順 `['麺類', 'ご飯もの']`）
- Produces（`src/types/order.ts`）: `SelectedOption`, `OrderItem`（設計書2章）。`Order` / `OrderDraft` は `OrderItem` を使う
- Produces（`src/lib/menuOptions.ts`）:
  - `type Selection = Record<string, string>`（groupId → choiceId）
  - `defaultSelection(item: MenuItem): Selection`
  - `unitPrice(item: MenuItem, sel: Selection): number`
  - `buildOrderItem(item: MenuItem, sel: Selection, quantity: number): OrderItem`（`key = menuItemId + '|' + groupId:choiceId をgroup定義順に '|' 連結`）
  - `itemKey(i: OrderItem): string`（`i.key ?? i.name`）
  - `changedOptions(i: OrderItem): SelectedOption[]`（`isDefault === false` のみ。`options` なしは `[]`）
  - `optionSummary(i: OrderItem): string`（全選択肢の `choiceLabel` を `・` 連結。なしは `''`）

メニュー値: `ramen` 醤油ラーメン 430 麺類 説明「あっさり醤油スープの定番」 画像 `/menu/ramen.jpg` / `curry` カレーライス 480 ご飯もの 説明「程よい辛さのごろっと具材」 画像 `/menu/curry.jpg`。サイズグループ `size`「サイズ」required, 初期 `regular`: `regular` 普通 0 / `large` 大盛り 150。福神漬け `fukujinzuke`「福神漬け」required:false, 初期 `with`: `with` つける 0 / `without` つけない 0（カレーのみ）。

- [ ] **Step 1: Vitest を入れる** — `npm i -D vitest@^2 jsdom@^25`、`package.json` に `"test": "vitest run"`、`vitest.config.ts` は `vite.config.ts` と同じ `@` エイリアス + `environment: 'jsdom'`
- [ ] **Step 2: 失敗するテストを書く**（`src/lib/menuOptions.test.ts`）
  - `defaultSelection(curry)` → `{ size: 'regular', fukujinzuke: 'with' }`
  - `unitPrice(curry, { size: 'large', fukujinzuke: 'without' })` → `630`
  - `buildOrderItem(curry, {size:'large', fukujinzuke:'without'}, 2)` → `price 630, quantity 2, key 'curry|size:large|fukujinzuke:without'`、options の `isDefault` は `[false, false]`
  - `changedOptions(buildOrderItem(ramen, defaultSelection(ramen), 1))` → `[]`
  - `changedOptions({ name: 'ラーメン', price: 430, quantity: 1 })`（旧データ）→ `[]`、`itemKey` → `'ラーメン'`、`optionSummary` → `''`
  - `optionSummary(buildOrderItem(curry, {size:'large', fukujinzuke:'without'}, 1))` → `'大盛り・つけない'`
- [ ] **Step 3: `npm test` で失敗を確認**（モジュールなし）
- [ ] **Step 4: 型・メニュー・関数を実装**
- [ ] **Step 5: `npm test` が通り、`npx tsc --noEmit` は既存画面の型エラーのみ（Task 2/5 で解消）であることを確認**
- [ ] **Step 6: Commit** `feat: メニューに選択肢（サイズ・福神漬け）を追加`

### Task 2: カートを行の識別子で扱う

**Files:**
- Modify: `src/store/cart.ts`
- Create: `src/store/cart.test.ts`

**Interfaces:**
- Consumes: `OrderItem`, `itemKey`
- Produces: `useCartStore` の `add(line: OrderItem)`, `increment(key: string)`, `decrement(key: string)`, `remove(key: string)`, `clear()`。`cartTotal`, `cartCount` は据え置き

- [ ] **Step 1: 失敗するテスト**
  - 同じ `buildOrderItem(curry, sel, 1)` を2回 `add` → `items.length 1, quantity 2`
  - 大盛りと普通を `add` → `items.length 2`
  - `add(buildOrderItem(ramen, def, 3))` → `quantity 3`（数量ごと加算）
  - 旧データ `{name:'ラーメン', price:430, quantity:1}` を `setState` で入れて `increment('ラーメン')` → `2`、`remove('ラーメン')` → 空
  - `cartTotal` → 単価×数量の合計
- [ ] **Step 2: 失敗を確認** → **Step 3: 実装**（比較はすべて `itemKey`）→ **Step 4: 通過を確認**
- [ ] **Step 5: Commit** `feat: カートを選択肢の組み合わせごとの行で管理`

### Task 3: 注文登録の冪等化とエラー文言

**Files:**
- Modify: `src/lib/orders/types.ts`, `src/lib/orders/firestore.ts`, `src/lib/orders/local.ts`
- Create: `src/lib/orders/local.test.ts`, `src/lib/errors.ts`, `src/lib/errors.test.ts`

**Interfaces:**
- Produces: `OrderRepository.createOrder(draft: OrderDraft, paymentMethod: PaymentMethod, orderId?: string): Promise<{ id: string; orderNumber: number }>` — `orderId` 指定時、同IDの注文が既にあればそれを返し、採番も書き込みもしない
- Produces: `toUserMessage(e: unknown): string` — `code === 'permission-denied'` または message に `insufficient permissions` → `'お店のシステム設定に問題があります。スタッフにお知らせください。'`、`Error` はその message、それ以外 `'エラーが発生しました'`

Firestore 実装: `runTransaction` 内で `tx.get(orderRef)` → 存在すれば返す → `tx.get(counterRef)` → `tx.set(counterRef)` と `tx.set(orderRef)`（読み取りを先に全部）。`orderId` 未指定は `doc(collection(db,'orders')).id`。

- [ ] **Step 1: 失敗するテスト** — Local: `createOrder(draft,'paypay','mp-1')` を2回 → 同じ `{id:'mp-1', orderNumber:1}`、`subscribeActiveOrders` の件数1。`orderId` なし2回 → 番号 1, 2。errors: 上記3パターン
- [ ] **Step 2: 失敗を確認** → **Step 3: 実装** → **Step 4: 通過を確認**
- [ ] **Step 5: Commit** `fix: 支払い済み注文の登録を冪等にし、権限エラーを日本語で表示`

### Task 4: 見た目の土台（色・アイコン・写真）

**Files:**
- Modify: `tailwind.config.js`, `src/index.css`, `index.html`, `vite.config.ts`
- Create: `src/components/icons.tsx`, `public/menu/ramen.jpg`, `public/menu/curry.jpg`

**Interfaces:**
- Produces: Tailwind 色 `ink`（DEFAULT `#1C1917`, `sub` `#57534E`, `faint` `#A8A29E`, `line` `#E7E5E4`）, `surface` `#F5F5F4`, `accent`（`bg` `#FDF3D7`, `fg` `#7A5300`）, `danger` `#B42318`, `success` `#15803D`, `paypay` `#FF0033`。`brand` と旧影・浮遊/ポップのアニメーションは削除。`animate-sheet-up`（0.25s）と `animate-fade-in` のみ残す
- Produces: `icons.tsx` の `CartIcon`, `CloseIcon`, `BackIcon`, `ClockIcon`, `StoreIcon`, `CheckIcon`, `MinusIcon`, `PlusIcon`（props: `className?`。`aria-hidden`、`stroke="currentColor"`、24×24 viewBox、線幅 1.75）
- `index.css`: `.app-bg` と `.btn-press` を削除、`body` 背景白・文字墨、`@media (prefers-reduced-motion: reduce)` でアニメーション無効
- `theme-color` / manifest `theme_color` を `#ffffff`
- 写真: `IMG_2854.jpeg`（ラーメン）/`IMG_2853.jpeg`（カレー）から料理部分を正方形に切り抜き 800px・JPEG 品質 82 で保存（価格文字と見出し帯が入らないこと）。元画像は削除

- [ ] **Step 1: 実装** → **Step 2: 切り抜き画像を目視確認（文字が写っていない）** → **Step 3: Commit** `style: 色・アイコン・メニュー写真を刷新`（`npm run build` は Task 5 完了まで未通過でよい）

### Task 5: メニュー画面と商品シート

**Files:**
- Modify: `src/pages/MenuPage.tsx`
- Create: `src/components/AppHeader.tsx`, `src/components/PickupBar.tsx`, `src/components/MenuRow.tsx`, `src/components/ItemSheet.tsx`, `src/components/OptionGroupField.tsx`, `src/components/QuantityStepper.tsx`, `src/components/Toast.tsx`, `src/store/toast.ts`
- Delete: `src/components/MenuCard.tsx`, `src/components/CartSheet.tsx`

**Interfaces:**
- Consumes: `MENU`, `MENU_CATEGORIES`, `defaultSelection`, `unitPrice`, `buildOrderItem`, `useCartStore.add`, icons
- Produces: `AppHeader({ title, back?: string, cartCount?: number })`、`PickupBar()`（文言「受取：LiSA校食堂」「できあがったらこの画面でお知らせします」）、`QuantityStepper({ value, min=1, onChange })`、`useToast` の `show(message: string)`（2秒で消える）、`<Toast />`（`App.tsx` に常設）
- MenuRow: `<button>` 全体。写真 88px 正方形・名前・説明（1行省略）・価格。カート内数量があれば写真左上に数字バッジ
- ItemSheet: `role="dialog" aria-modal`、背景タップと閉じるボタンで閉じる、写真（4:3）・名前・説明・基本価格・各 `OptionGroupField`・最下部固定の `QuantityStepper` + 「カートに追加する・¥{unitPrice×qty}」。開くたび `defaultSelection` と数量1に初期化。追加で `add` → 閉じる → `show('カートに追加しました')`
- OptionGroupField: 見出し + required なら「必須」ラベル（アクセント色）、`role="radiogroup"`、各選択肢は `role="radio" aria-checked` の行ボタン（ラベル左、差額 `+¥150` 右、選択中は墨の丸チェック）
- 最下部固定バー（カートが空でないとき）: 墨ボタン「カートを見る」+ 右に `N点・¥合計` → `/checkout`

- [ ] **Step 1: 実装** → **Step 2: `npm run build` 通過（Task 6/7 の画面が旧 API を使う箇所は同タスクで直す。ここで型エラーが残る場合は最小限の差し替えのみ）** → **Step 3: 390px で メニュー・シート（カレー）のスクショを確認** → **Step 4: Commit** `feat: メニュー画面と商品シートを刷新`

### Task 6: カート兼注文確認（/checkout）

**Files:**
- Modify: `src/pages/CheckoutPage.tsx`, `src/components/CartList.tsx`

**Interfaces:**
- Consumes: `useCartStore`, `itemKey`, `optionSummary`, `toUserMessage`, `createOrder(draft, method, orderId?)`, `getPendingPayPayId`, `clearPendingPayPayId`, `confirmPayPayPayment`
- CartList: 行ごとに 写真56px・名前・`optionSummary`（灰色）・単価、右に `QuantityStepper`（min 0 で 0 は削除）と金額。「削除」テキストボタン
- 構成: `AppHeader title="注文の確認" back="/menu"` → 受け取り情報ブロック（StoreIcon「LiSA校食堂」/ClockIcon「できあがり次第（この画面でお知らせ）」）→「ご注文内容」+「商品を追加」リンク → CartList → 合計 → 注意事項（「注文確定後のキャンセル・変更はできません」「受け取りは注文番号でお呼びします」）→ 最下部固定の PayPay ボタン「PayPayで支払う・¥合計」
- 戻り処理: 支払い確認 OK 後に `createOrder(draft, 'paypay', mpid)`。失敗時は状態 `paidButFailed` にし、カート画面ではなく専用表示（CheckIcon と「お支払いは完了しています」、`toUserMessage` の内容、墨ボタン「注文の登録をやり直す」= 同じ mpid で `createOrder` を再実行）。成功で `clearPendingPayPayId` → カートを空に → `/order/:id`
- 支払い確認 NG は従来どおりカート画面に戻してエラー表示（文言は `toUserMessage`）

- [ ] **Step 1: 実装** → **Step 2: `npm run build`** → **Step 3: モック決済で 注文確認 → 支払う → 注文番号画面 を確認、スクショ** → **Step 4: Commit** `feat: カート兼注文確認画面を刷新し、支払い後の登録失敗を再試行可能に`

### Task 7: 注文番号画面・厨房ボード・入口

**Files:**
- Modify: `src/pages/OrderStatusPage.tsx`, `src/pages/StaffPage.tsx`, `src/pages/GatePage.tsx`, `src/components/StatusBadge.tsx`, `src/components/PaymentModalHost.tsx`

**Interfaces:**
- Consumes: `changedOptions`, `optionSummary`, `itemKey`, icons, 色トークン
- OrderStatusPage: 白背景。「注文番号」小見出し + 番号 64px bold、状態ステップ（3段の横棒、到達済みは墨、完了時は success）、完了時は success 色の帯「お受け取りいただけます」「カウンターで注文番号をお伝えください」、注文内容（`optionSummary` 付き）、「メニューに戻る」
- StaffPage（厨房）: 薄灰背景・白い注文カード（線で区切り）。番号 32px bold。各行の `changedOptions` を行の下に表示：`large` は「大盛り」を墨の太字 + アクセント地、`without` は「福神漬けなし」を `danger` 色太字（表示文言は `groupLabel` と `choiceLabel` から: サイズ系は `choiceLabel`、それ以外は `${groupLabel}${choiceLabel === 'つけない' ? 'なし' : choiceLabel}`）。ボタンは「調理開始」（枠線）・「調理完了」（墨）。スタッフ用合言葉画面も入口と同じ見た目
- GatePage: 上に小さく「LiSA校」、大きく「学食モバイルオーダー」（`text-balance`、2行に割れても単語途中で切れない `word-break: keep-all`）、説明「並ばずに、スマホで注文・お支払い」、入力欄（線、角丸8、高さ52）、墨ボタン「はじめる」、下に「食堂スタッフの方はこちら」
- StatusBadge: 色を 受付済み=ink系, 調理中=accent, 完了=success に。点滅なし
- PaymentModalHost: 角丸・影をルールに合わせるのみ（PayPay 赤は維持）

- [ ] **Step 1: 実装** → **Step 2: `npm run build` と `npm test`** → **Step 3: 各画面のスクショ確認** → **Step 4: Commit** `feat: 注文番号画面・厨房ボード・入口を刷新`

### Task 8: 全体の動作確認と README 更新

**Files:**
- Modify: `README.md`（「画面とフロー」に選択肢とテスト実行 `npm test` を追記）

- [ ] **Step 1: ローカル（Firebase 未設定＝ローカル同期、モック決済）で一連の流れ: 入口 → メニュー → カレー大盛り・福神漬けなし ×1 + ラーメン普通 ×2 → 注文確認（合計 ¥1,490）→ 支払う → 注文番号 → 厨房に「大盛り」「福神漬けなし」→ 調理完了 → 学生画面が完了表示**
- [ ] **Step 2: 旧カート（localStorage に `{name,price,quantity}`）を入れて注文確認画面が表示・操作できることを確認**
- [ ] **Step 3: `npm test` / `npm run build` 通過、Global Constraints を grep で確認（`font-black|font-extrabold|brand|🛒` が src に無い）**
- [ ] **Step 4: Commit & push** `docs: README に選択肢とテストを追記`
