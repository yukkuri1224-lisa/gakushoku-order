# mealgo（ミールゴー）— LiSA校食堂のモバイルオーダー（デモ版）

学生がスマホから学食メニューを注文し、PayPay（デモではモック）で支払って注文番号を受け取る。
食堂スタッフは専用画面で注文を受け取り、「調理完了」を押すと学生の画面にリアルタイムで通知が届く——
というデモアプリです。

**技術スタック**: Vite + React + TypeScript（SPA / PWA）／ Tailwind CSS ／ Firebase Firestore（リアルタイム同期）／ Vercel デプロイ

---

## ✨ 特長 / 割り切り

- **決済は差し替え式**: デモは「モック決済」（PayPay 風の確認画面）。`VITE_PAYMENT_MODE=paypay` にすれば本番実装へ切替（本番実装はスタブ）。
- **同期も差し替え式**: Firebase を設定すれば Firestore で**端末をまたいだ**リアルタイム同期。
  **未設定でもそのまま動く**よう、**ローカル簡易同期**（同一PCの別タブ間, BroadcastChannel + localStorage）に自動フォールバックします。→ まず1台のPCですぐ試せます。
- **認証は簡易ゲート**: 注文画面・スタッフ画面に入る前に合言葉を1回入力するだけ（本格認証ではありません）。
- やらないこと: 本格的なユーザー登録/ログイン、実際の PayPay 決済、メニュー管理画面、売上集計、厳密なセキュリティ。

---

## 📁 主な構成

```
gakushoku-order/            ← リポジトリのルート（package.json はここ）
├── index.html
├── package.json
├── vite.config.ts          ← Vite + PWA + alias(@/)
├── tsconfig.json           ← alias(@/) の paths
├── tailwind.config.js / postcss.config.js
├── vercel.json             ← SPA のルーティング fallback
├── firestore.rules         ← デモ用 Firestore ルール
├── .env.example            ← 環境変数サンプル
├── public/                 ← icon-192.png / icon-512.png
└── src/
    ├── main.tsx / App.tsx           ← ルーティング
    ├── pages/                       ← Gate / Menu / Checkout / OrderStatus / Staff
    ├── components/
    ├── data/menu.ts                 ← デモメニュー定数
    ├── store/                       ← cart / paymentUi（zustand）
    ├── lib/
    │   ├── firebase.ts
    │   ├── payment/                 ← types / mock / paypay / index（getPaymentProvider）
    │   └── orders/                  ← types / firestore / local / index（getOrderRepository）
    └── types/order.ts
```

---

## 🖥 画面とフロー

公開中: **https://gakushoku-order.vercel.app/**（スタッフ用は `/staff`）

1. `/` 入口。学校の Google アカウントでログイン（`VITE_LOGIN_DOMAIN` を設定したとき）／合言葉（設定していないとき）。一度入った端末は自動で次へ →
2. `/start` ご利用方法の選択（店内で食べる／お持ち帰り）→
3. `/menu` メニュー（定食・麺類・カレー・軽食の 23 品を 2 列のカードで表示。上の「すべて／定食／麺類／カレー／軽食」で絞り込める。商品をタップすると下から詳細シートが開き、うどん／そば・サイズ・福神漬けを選んでカートへ。売り切れの商品は「売り切れ」と出て選べない）→
4. `/checkout` 注文内容の確認（受け取り場所・ご利用方法の変更・お支払い方法・数量変更／削除。売り切れの商品が入っていると支払えない）→ PayPay で支払う →
5. `/order/:orderId` 注文番号（進み具合・「あなたの前に◯件」・受け取り方）。できあがると全画面のお知らせと通知音（「ピンポーン」）。お知らせの「わかりました」を押すとホーム（`/`）に戻る。できあがった注文の画面では下のボタンが「追加で注文する」ではなく「ホームに戻る」になる
- `/staff` 厨房ボード（別の合言葉）。
  - 「注文」タブ: 注文ごとに「店内／持ち帰り」のバッジ、「うどん／そば」（毎回）と「大盛り」「福神漬けなし」など初期値から変えた選択肢を表示 →「調理完了」で学生画面に通知。新しい注文が入ると通知音。
  - 「売り切れ」タブ: 商品ごとのボタンで「販売中」⇄「売り切れ」を切り替える。注文画面にすぐ反映。売り切れはその日だけ（次の日は自動で販売中に戻る）。Firestore の `dailyCounters/soldOut-{日付}` に保存するので、ルールの更新は不要。
- **通知音**: ブラウザは画面を一度もタップしていないページから音を出させないため、最初のタップで音の準備をする。まだ準備できていないとき（PayPay から戻った直後など）は「通知音をオンにする」ボタンが出る。iPhone のマナーモード中は鳴らない（画面のお知らせは出る）。
- 選択画面とメニュー画面の上部に、この端末で今日した注文の「注文中」カードが出る（注文番号の画面を閉じても戻れる）。
- メニューと選択肢は `src/data/menu.ts` で定義（`optionGroups`。`defaultChoiceId` を省いたグループは初期値なしで、選ぶまでカートに入れられない）。
- 商品の画像はイメージ。`public/menu/illust/`（いただいたイラスト）と `public/menu/irasutoya/`（[いらすとや](https://www.irasutoya.com/)。利用規約の範囲で使用）。
- 支払い後に注文の登録だけ失敗した場合は「注文の登録をやり直す」で、支払いをやり直さずに再登録できる（同じ支払いIDの注文は1件にまとまる）。

---

## 🚀 セットアップ（ローカルで動かす）

> **このPCでは node / npm は Windows 側にあります。以下のコマンドは PowerShell で実行してください（WSL では実行しません）。**

### 必要なもの
- Node.js 18 以上（推奨 20+）
- （任意）Firebase アカウント … 端末をまたぐ同期を試す場合のみ
- （デプロイ時）GitHub アカウント / Vercel アカウント

### 手順
```powershell
cd C:\Users\nre10\Downloads\gakushoku-order
npm install
npm run dev
```
ブラウザで表示された URL（通常 http://localhost:5173 ）を開きます。

- 合言葉（学生）: `gakushoku2026`
- 合言葉（スタッフ）: `staff2026`
- ※ これらは `.env.local` 未作成でも動くデフォルト値です（`src/lib/gate.ts`）。

### 1台のPCでフロー全体を試す（Firebase 不要）
1. タブA で `/`（合言葉 `gakushoku2026`）→ ご利用方法を選ぶ → 商品をタップして「カートに入れる」→「注文へ進む」→「PayPayで支払う」→ モック決済「支払う」→ 注文番号が表示される
2. タブB で `/staff`（合言葉 `staff2026`）→ 注文がリアルタイム表示される
3. タブB で「調理完了」→ タブA に「できあがりました」の全画面のお知らせが出て通知音が鳴る →「わかりました」でホーム（ご利用方法の選択）に戻る

> この状態は **ローカル簡易同期モード**（同一PCの別タブ間のみ）です。
> 別の端末（スマホ等）と同期したい場合は次の Firebase 設定を行ってください。

---

## 🔥 Firebase 設定（端末をまたぐリアルタイム同期）

1. [Firebase コンソール](https://console.firebase.google.com/) で**プロジェクトを作成**。
2. 左メニュー **Firestore Database** → **データベースを作成** → ロケーション選択。
   ルールは **テストモードで開始**（30日間の全許可）でOK。あるいは付属の `firestore.rules` を使う。
   > ⚠ テストモードのルールは **30日で期限切れ** になり、以降は支払い後に「お店のシステム設定に問題があります」
   > （英語では `Missing or insufficient permissions.`）となって注文が登録できません。
   > 期限が切れたら Firestore → **ルール** に `firestore.rules` の中身を貼り付けて「公開」してください。
3. **プロジェクトの設定**（⚙️）→ **マイアプリ** → **ウェブアプリ（</>）を追加** → 表示される `firebaseConfig` の値を控える。
4. `.env.example` をコピーして `.env.local` を作り、Firebase の6つの値を入れる。
   ```powershell
   Copy-Item .env.example .env.local
   ```
   ```dotenv
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
   > 6つが**すべて**埋まると自動で Firestore 同期に切り替わります（1つでも空ならローカル同期のまま）。
5. `npm run dev` を再起動。これで別の端末（スマホで本番URL、もう一台のPC等）とリアルタイム同期します。

- データ構造: `orders`（注文ドキュメント）、`dailyCounters/{YYYY-MM-DD}`（当日の通し番号をトランザクション加算）。

---

## 🎨 ロゴとアイコン

- ロゴ: `public/brand/mealgo-logo.png`（「ミールゴー」入り・入口の画面）、`public/brand/mealgo-wordmark-96.png`（文字だけ・ヘッダー）。いただいたロゴの白い背景を透明にしたもの。
- アイコン: いただいたアイコンから白い図柄を取り出して作り直したもの。`favicon-32.png`・`favicon-48.png`（タブ）、`apple-touch-icon.png`（iPhone のホーム画面）、`icon-192.png`・`icon-512.png`（Android など）、`icon-512-maskable.png`（丸く切り抜かれても欠けないよう図柄を少し小さく）。
- 色: ボタン・価格は、ロゴのオレンジ（`#F57D03`）と同じ系統で白文字が読める濃さの `#B35500`（`tailwind.config.js` の `brand`）。

---

## 📱 スマホで使う

- **スマホで開く**: パソコンで開くと画面の左に QR コードが出るので、スマホのカメラで読み取る（`public/qr-open-on-phone.svg`）。
- **ホーム画面に追加**: ご利用方法を選ぶ画面に案内が出る。iPhone は共有ボタン →「ホーム画面に追加」、Android の Chrome は「ホーム画面に追加する」ボタン。追加するとアプリのように全画面で開ける（閉じた案内は次から出ない）。
- **PayPay で支払ったあと**: スマホでは PayPay アプリから「ふだんのブラウザ」に戻ることがある。PayPay へ移る前に注文の中身を Firestore（`orders/pending-{支払いID}`）に預けるので、戻った先のブラウザのカートが空でも注文ができる。注文を始めた画面（ホーム画面のアプリなど）に戻ると、カートを空にして注文番号を出す。

---

## 🏫 学校の Google アカウントでログイン（gl.pen-kanagawa.ed.jp だけ）

学生の入口を「合言葉」から「Google でログイン（指定ドメインのアカウントだけ）」に切り替えられます。
**設定するまでは合言葉のまま**なので、公開中のサイトが止まることはありません。

1. [Firebase コンソール](https://console.firebase.google.com/) → プロジェクト → **Authentication** →「**始める**」。
2. **Sign-in method** → **Google** →「有効にする」→ サポートメールを選んで保存。
3. **設定（Settings）** → **承認済みドメイン** →「ドメインの追加」で `gakushoku-order.vercel.app` を追加。
4. Vercel → プロジェクト → **Settings → Environment Variables** に `VITE_LOGIN_DOMAIN` = `gl.pen-kanagawa.ed.jp` を追加 → **Deployments** から **Redeploy**。
5. （任意）注文の作成もそのドメインの人だけに絞るなら、`firestore.rules` の説明どおりに orders のルールを置き換えて公開。

- ほかのアカウント（gmail など）でログインしようとすると、すぐにログアウトさせて「@gl.pen-kanagawa.ed.jp のアカウントでログインしてください」と出します。
- ⚠ Google Workspace for Education では、**18 歳未満に設定された生徒は、学校の管理者が許可していない外部サービスに Google でログインできません**（管理者がアプリを許可するか、「基本的なログイン情報だけを求めるアプリ」を許可する設定が必要）。生徒がログインできない場合は、学校（県）の Google Workspace 管理者に相談してください。このアプリが求めるのは名前・メールアドレス・プロフィール写真だけです。

---

## 🏗 ビルド

```powershell
npm test           # 単体テスト（Vitest）。選択肢の計算・カート・注文登録の二重防止など
npm run build      # tsc 型チェック + vite build。出力は dist/
npm run preview    # ビルド結果をローカルで確認
```

---

## 🐙 GitHub へ上げる

`.gitignore` で `node_modules` / `dist` / `.env.local` は除外済みです。

```powershell
cd C:\Users\nre10\Downloads\gakushoku-order
git init
git add .
git commit -m "学食モバイルオーダー（デモ版）"
git branch -M main
git remote add origin https://github.com/<あなたのユーザー名>/gakushoku-order.git
git push -u origin main
```

---

## ▲ Vercel へデプロイ

1. [Vercel](https://vercel.com/) にログイン →「**Add New… → Project**」→ GitHub の `gakushoku-order` リポジトリを **Import**。
2. **Framework Preset = Vite**（自動認識されます。`Other` と表示されたら手動で **Vite** を選ぶ）。
   - **Root Directory** = リポジトリ直下（`package.json` がある場所。今回はそのままでOK）。
   - **Build Command** = `npm run build` / **Output Directory** = `dist`（Vite なら既定で正しい）。
3. **Environment Variables** に必要な変数を登録（`.env.example` 参照）。
   - 最低限: `VITE_ACCESS_PASSWORD` / `VITE_STAFF_PASSWORD` / `VITE_PAYMENT_MODE=mock`
   - 端末間同期を使うなら `VITE_FIREBASE_*` の6つも登録。
4. **Deploy**。発行された本番URLで動作します。
   - SPA のため、`/staff` や `/order/xxx` を直接開いても 404 にならないよう `vercel.json` で fallback 設定済み。

> ⚠ Vite では環境変数は `VITE_` で始める必要があり、**ブラウザに露出**します。
> ここで使うパスワードはあくまでデモ用の簡易ゲートで、本物の機密ではありません。

---

## 🔁 PayPay 決済（サンドボックス / 本番）

決済は `src/lib/payment/` で抽象化され、`VITE_PAYMENT_MODE` で切り替わります（`mock` / `paypay`）。
`paypay` モードは **PayPay for Developers のサンドボックス**（加盟店契約なしでテスト可能）に対応済みです。

**仕組み**
- ブラウザ → サーバー関数 `api/paypay/create.js`（`QRCodeCreate`）で決済URLを取得 → PayPay の決済ページへリダイレクト。
- 支払い後 `/checkout?pp=return&mpid=...` に戻り、`api/paypay/status.js`（`GetCodePaymentDetails`）で `COMPLETED` を確認してから注文を作成。
- 秘密鍵（API_SECRET）は **サーバー関数（/api）でのみ** 使用。環境変数に `VITE_` を付けない＝ブラウザに露出しない。

**設定手順**
1. [PayPay for Developers](https://developer.paypay.ne.jp/) に登録し、サンドボックスの
   `API_KEY` / `API_SECRET` / `MERCHANT_ID` を取得。
2. Vercel の **Environment Variables** に登録（`VITE_` は付けない）:
   - `PAYPAY_API_KEY` / `PAYPAY_API_SECRET` / `PAYPAY_MERCHANT_ID`
   - あわせて `VITE_PAYMENT_MODE=paypay` に変更（クライアントを PayPay モードに切替）。
3. 再デプロイ（git push で自動）。本番URLで「PayPayで支払う」を押すとサンドボックス決済が動きます。

**注意**
- `/api` は **Vercel 上**（または `vercel dev`）でのみ動作。プレーンな `npm run dev` では動かないので、
  ローカル確認は `VITE_PAYMENT_MODE=mock` のままにする。
- 本番化するときは `api/paypay/*.js` の `env: 'STAGING'` を `'PROD'` にし、本番の加盟店契約・鍵に差し替える。

**PayPay の支払い画面に出る店名・ロゴ（mealgo）**
- 支払い画面の上に出る店名（加盟店名）とロゴは、PayPay 側に登録された加盟店の情報で、API やこのアプリのコードからは変えられない。
  アプリから送るのは注文の説明（`orderDescription`。`api/paypay/create.js` で「mealgo（LiSA校食堂）」）だけ。
- ロゴ画像: `public/brand/mealgo-paypay-256.png`（256×256・PNG。丸く切り抜かれても欠けないよう余白をとってある。公開中のサイトの `/brand/mealgo-paypay-256.png` からも保存できる）。
- **サンドボックス（テスト）**: PayPay for Developers の画面からは店名・ロゴを変えられない。PayPay for Developers の問い合わせフォームから、
  加盟店ID（`PAYPAY_MERCHANT_ID`）・変えたい内容（店名を「mealgo」に、ロゴを上の画像に）・環境（サンドボックス）を伝えて変更を依頼する。
- **本番**: PayPay for Business のブランドプロフィールで、屋号（店名）とロゴを変更する（店名の変更は PayPay の審査あり。ロゴは 256×256 推奨、1:1、PNG/JPG、2MB まで）。

---

## 🧩 本番化の差し替えポイント（コード内コメントで明示）

| 項目 | 場所 | 内容 |
|---|---|---|
| 決済 | `src/lib/payment/paypay.ts` ＋ `api/paypay/*.js` | PayPay 連携済み（サンドボックス）。本番は env を PROD に |
| パスワード | `src/lib/gate.ts` / 環境変数 | 簡易ゲート → 本格認証は別途設計 |
| メニュー供給元 | `src/data/menu.ts` | コード定数 → CMS / 管理画面等 |
| 同期方式 | `src/lib/orders/index.ts` | Firestore / ローカルを自動選択 |

---

## トラブルシュート

- **真っ白 / Firestore エラーで止まる**: `.env.local` の Firebase 値が一部だけ入っていないか確認（全部空ならローカル同期で動きます）。
- **支払い後に「お店のシステム設定に問題があります」**: Firestore のルールが期限切れ・または書き込み禁止になっています。
  Firestore → ルール に `firestore.rules` の中身を貼り付けて公開し、画面の「注文の登録をやり直す」を押してください（再度の支払いは不要）。
- **Vercel で直接URLが 404**: `vercel.json` がデプロイに含まれているか確認。
- **`@/` が解決できない**: `vite.config.ts` の `resolve.alias` と `tsconfig.json` の `paths` の両方が必要（本リポジトリは設定済み）。
- **通知音が鳴らない**: ブラウザの自動再生制限のため。画面を1回タップ/クリックしてから再度試してください（音はベストエフォート）。
