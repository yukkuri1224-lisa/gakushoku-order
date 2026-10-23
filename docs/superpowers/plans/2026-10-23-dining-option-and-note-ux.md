# 利用方法の選択・アイコン刷新・note 記事の UI/UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新しいサイトアイコン、合言葉直後の「店内／お持ち帰り」選択画面、note 記事由来の UI/UX 改善（設計書の取り入れ表 #1〜#14）を入れる。

**Architecture:** 既存の Vite + React + Tailwind + zustand を維持。判断ロジックは副作用のない関数に切り出して Vitest で固め、画面は小さな部品で組む。注文データは `buildOrderData()` に一本化する。

**Tech Stack:** Vite 5, React 18, TypeScript, Tailwind 3, zustand 5, Firebase 11, Vitest 2 + jsdom

**Spec:** `docs/superpowers/specs/2026-10-23-dining-option-and-note-ux-design.md`

## Global Constraints

- 色は既存トークンのみ（`ink` / `surface` / `accent` / `danger` / `success` / `paypay`）。グラデーション禁止
- 太さは `font-normal` / `font-bold` のみ。角丸は `rounded-lg`（8px）、タグとバッジのみ `rounded-full`
- 影はシートと最下部固定バーのみ（`shadow-sheet`）
- 絵文字を UI に使わない。アイコンは `src/components/icons.tsx` のインライン SVG
- 押せる要素は 44px 以上、メインボタンは高さ 52px
- Firestore に `undefined` を書かない
- 根拠のない数値（待ち時間・営業時間）を表示しない

## Review Focus

1. PayPay から別タブで戻った場合 → 利用方法が `localStorage` に残っており、注文に記録されること（Task 2 のテスト）
2. 旧データの注文（`diningOption` なし）→ 注文番号画面・厨房・注文中カードで落ちないこと（Task 6 のテスト）
3. 利用方法を選ばずに `/checkout` を直接開く → 支払いボタンが押せず、理由が書いてあること（Task 5 のテスト）
4. 日付をまたいだ「この端末の注文」→ 前日の注文が注文中カードに出ないこと（Task 5 のテスト）
5. 同じ支払いIDで登録をやり直す → 端末の注文記録が重複しないこと（Task 5 のテスト）

---

### Task 1: サイトアイコン

**Files:** Create `public/favicon.svg`, `public/apple-touch-icon.png`; Replace `public/icon-192.png`, `public/icon-512.png`; Modify `index.html`, `vite.config.ts`

- [ ] SVG を作る（512 viewBox、墨の地、白いどんぶり＋縁＋高台、`#FDF3D7` の湯気 3 本。favicon は角丸 rx=112、PNG 用は全面）
- [ ] Chromium で 512 / 192 / 180 の PNG に書き出し、16px・32px 相当の縮小でも形が分かることを目で確認
- [ ] `index.html` に `favicon.svg`・PNG フォールバック・`apple-touch-icon` を追加、`vite.config.ts` の `includeAssets` に追加
- [ ] `npm run build` → Commit `style: サイトアイコンを刷新`

### Task 2: 利用方法のデータ

**Files:** Create `src/lib/dining.ts`, `src/store/dining.ts`, `src/lib/orders/buildOrderData.ts` と各テスト; Modify `src/types/order.ts`, `src/lib/orders/firestore.ts`, `src/lib/orders/local.ts`

**Interfaces (Produces):**
- `type DiningOption = 'eat_in' | 'takeout'`（`src/types/order.ts`）、`Order.diningOption?`、`OrderDraft.diningOption?`
- `DINING_LABEL: Record<DiningOption, string>`（店内で食べる／お持ち帰り）、`DINING_SHORT: Record<DiningOption, string>`（店内／持ち帰り）
- `useDiningStore`: `{ option: DiningOption | null; setOption(o: DiningOption): void }`、persist key `gakushoku.dining`（localStorage）
- `buildOrderData(draft: OrderDraft, paymentMethod: PaymentMethod, orderNumber: number, now: number): Omit<Order, 'id'>`

- [ ] 失敗するテスト: `buildOrderData` は `diningOption` 未指定ならキー自体を持たない／指定時は含む・`status: 'paid'`・`createdAt: now`。`useDiningStore` は初期 null、`setOption('takeout')` で localStorage の `gakushoku.dining` に保存
- [ ] 実装し、両リポジトリの `createOrder` を `buildOrderData` 経由にする → `npm test` 通過 → Commit

### Task 3: 利用方法の選択画面とルーティング

**Files:** Create `src/pages/DiningPage.tsx`, `src/lib/greeting.ts`(+test), `src/components/RequireDining.tsx`, `src/App.test.tsx`; Modify `src/App.tsx`, `src/pages/GatePage.tsx`, `src/components/icons.tsx`

**Interfaces:** `greeting(d: Date): string`（5–10時 おはようございます／11–17時 こんにちは／それ以外 こんばんは）、`RequireDining({ children })`

- [ ] 失敗するテスト: `greeting` の境界（4:59→こんばんは、5:00→おはようございます、10:59→おはよう、11:00→こんにちは、17:59→こんにちは、18:00→こんばんは）。`App` を MemoryRouter で描画し、ゲート済み＋未選択で `/menu` → 「ご利用方法を選んでください」、ゲート済みで `/` → 同じく選択画面、選択済みで `/menu` → 「メニュー」
- [ ] 選択画面: あいさつ・見出し・2 枚の大きなカード（アイコン、名前、補足、選択中ならチェック）。タップで保存して `/menu` へ。下に「価格は店内・お持ち帰りとも同じです」
- [ ] Commit

### Task 4: メニュー画面と商品シート

**Files:** Modify `src/lib/menuOptions.ts`(+test), `src/components/PickupBar.tsx`, `src/components/MenuRow.tsx`, `src/components/ItemSheet.tsx`, `src/components/OptionGroupField.tsx`, `src/pages/MenuPage.tsx`; Create `src/components/OptionTags.tsx`

**Interfaces:** `priceLabel(item: MenuItem): string`（有料の選択肢があれば `¥430〜`、なければ `¥430`）、`OptionTags({ item: OrderItem })`

- [ ] 失敗するテスト: `priceLabel(ramen) === '¥430〜'`、選択肢なしの商品 → `'¥500'`
- [ ] 帯「[アイコン] 店内で食べる｜LiSA校食堂　変更」、商品行の価格に `priceLabel`、シートを「サムネイル 80px＋名前＋説明＋価格〜」の見出し、選択肢は 2 列カード（radio、チェック、+¥150）、「数量」の行、全幅ボタン「カートに入れる・¥630」、最下部バー「[点数] 合計 ¥1,490 ／ 注文へ進む ›」
- [ ] 390px でシートがスクロールなしで収まることをスクショで確認 → Commit

### Task 5: 注文内容の確認

**Files:** Create `src/lib/myOrders.ts`(+test), `src/components/DiningChoice.tsx`, `src/pages/CheckoutPage.test.tsx`; Modify `src/pages/CheckoutPage.tsx`, `src/components/CartList.tsx`

**Interfaces:** `rememberOrder(id: string, createdAt: number): void`、`todaysOrderIds(now?: Date): string[]`（新しい順、最大 5 件、今日以外は削除）、`DiningChoice({ value, onChange })`（2 列の radio カード）

- [ ] 失敗するテスト: `rememberOrder` 2 回同じ ID → 1 件、前日の記録は `todaysOrderIds` に出ない。CheckoutPage: カートあり・利用方法なし → ボタンが disabled で「ご利用方法を選んでください」
- [ ] セクション（受け取り場所／ご利用方法／お支払い方法／ご注文内容（N点）＋商品を追加）、タグ表示、「合計（税込）」、注意書き「注文を確定すると支払いが行われます…」、最下部「LiSA校食堂（店内で食べる）合計（税込）」＋PayPay ボタン、登録中は「注文を確定しています…」全画面、成功時に `rememberOrder`、`diningOption` を draft に入れる
- [ ] Commit

### Task 6: 注文番号画面・できあがりのお知らせ・注文中カード・厨房

**Files:** Create `src/lib/orderProgress.ts`(+test), `src/components/ReadyOverlay.tsx`, `src/components/ActiveOrders.tsx`, `src/hooks/useOrders.ts`, `src/pages/StaffPage.test.tsx`; Modify `src/pages/OrderStatusPage.tsx`, `src/pages/StaffPage.tsx`, `src/pages/DiningPage.tsx`, `src/pages/MenuPage.tsx`

**Interfaces:**
- `queueAhead(order: Order, active: Order[]): number`
- `isShownInActiveCard(order: Order, now: number): boolean`（未完了、または完了後 30 分以内）
- `newlyCompleted(prev: Map<string, OrderStatus>, orders: Order[]): Order[]`
- `useOrder(id)`, `useMyOrders()`, `useActiveOrders()`, `useCompletionAlert(orders): { ready: Order | null; dismiss(): void }`

- [ ] 失敗するテスト: `queueAhead`（自分より前の paid/preparing のみ数える、自分自身・完了は数えない）、`isShownInActiveCard`（完了 29 分→true、31 分→false、`completedAt` なしの完了→false）、`newlyCompleted`（prev に無い ID は対象外、paid→completed のみ）、厨房に「持ち帰り」バッジ、旧データ（diningOption なし）でもバッジなしで描画
- [ ] 注文番号画面: 「ご注文ありがとうございました」、カード（注文番号・ご利用方法・注文日時・ステッパー・前に◯件）、受け取り方の手順、ご注文内容（タグ）、追加で注文する。できあがりで全画面のお知らせ
- [ ] 選択画面・メニュー画面に注文中カード（できあがりのお知らせ付き）
- [ ] Commit

### Task 7: 通しの確認と反映

- [ ] モック決済で: 合言葉 → 選択画面 → お持ち帰り → カレー大盛り → 確認画面で店内に変更 → 支払う → 注文番号（前に◯件）→ 厨房で「店内」バッジ → 調理完了 → 全画面のお知らせ → メニューに戻ると注文中カード
- [ ] `npm test` / `npm run build`、禁止事項を grep（`font-black|font-extrabold|gradient|🛒`）
- [ ] README 更新 → Commit → `main` に早送りマージして push
