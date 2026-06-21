# 学食モバイルオーダー（デモ版）

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

1. `/` 合言葉ゲート → 2. `/menu` メニュー注文 → 3. `/checkout` モック決済 →
4. `/order/:orderId` 注文番号＆状態表示（リアルタイム）
- `/staff` 食堂スタッフ画面（別の合言葉）。注文一覧 →「調理完了」で学生画面に通知。

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
1. タブA で `/`（合言葉 `gakushoku2026`）→ メニュー追加 → 「PayPayで支払う」→ モック決済「支払う」→ 注文番号が表示される
2. タブB で `/staff`（合言葉 `staff2026`）→ 注文がリアルタイム表示される
3. タブB で「調理完了」→ タブA が「お受け取りいただけます」に変わり通知音が鳴る

> この状態は **ローカル簡易同期モード**（同一PCの別タブ間のみ）です。画面上部に黄色の案内が出ます。
> 別の端末（スマホ等）と同期したい場合は次の Firebase 設定を行ってください。

---

## 🔥 Firebase 設定（端末をまたぐリアルタイム同期）

1. [Firebase コンソール](https://console.firebase.google.com/) で**プロジェクトを作成**。
2. 左メニュー **Firestore Database** → **データベースを作成** → ロケーション選択。
   ルールは **テストモードで開始**（30日間の全許可）でOK。あるいは付属の `firestore.rules` を使う。
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

## 🏗 ビルド

```powershell
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

## 🔁 デモ → 本番（PayPay）への切り替え

決済は `src/lib/payment/` でインターフェース抽象化されています。

1. `VITE_PAYMENT_MODE=paypay` に変更（`getPaymentProvider()` が実装を切替）。
2. `src/lib/payment/paypay.ts` の `PayPayPaymentProvider.pay()` を実装。
   - PayPay は法人の加盟店契約・審査が必要。シークレットを扱うため、ブラウザから直接ではなく
     **Vercel Serverless Functions（`/api`）経由**で API を呼ぶ設計にすること。

---

## 🧩 本番化の差し替えポイント（コード内コメントで明示）

| 項目 | 場所 | 内容 |
|---|---|---|
| 決済 | `src/lib/payment/paypay.ts` | PayPay 本番実装に差し替え |
| パスワード | `src/lib/gate.ts` / 環境変数 | 簡易ゲート → 本格認証は別途設計 |
| メニュー供給元 | `src/data/menu.ts` | コード定数 → CMS / 管理画面等 |
| 同期方式 | `src/lib/orders/index.ts` | Firestore / ローカルを自動選択 |

---

## トラブルシュート

- **真っ白 / Firestore エラーで止まる**: `.env.local` の Firebase 値が一部だけ入っていないか確認（全部空ならローカル同期で動きます）。
- **Vercel で直接URLが 404**: `vercel.json` がデプロイに含まれているか確認。
- **`@/` が解決できない**: `vite.config.ts` の `resolve.alias` と `tsconfig.json` の `paths` の両方が必要（本リポジトリは設定済み）。
- **通知音が鳴らない**: ブラウザの自動再生制限のため。画面を1回タップ/クリックしてから再度試してください（音はベストエフォート）。
