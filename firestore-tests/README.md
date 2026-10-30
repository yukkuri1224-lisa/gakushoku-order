# Firestore のルールを確かめる

`../firestore.rules`（本番用のルール）を、Firebase のエミュレーター（手元で動く Firestore）の上で、
実際に読み書きして確かめるテストです。本物のデータベースには触れません。

- 通すもの: 学校の Google アカウントでの注文の作成、スタッフによる状態の更新・売り切れの切り替え など
- 断るもの: ログインしていない人、gmail などほかのアカウント、メール未確認、似たドメイン、
  ほかの人の UID での注文、学生による状態の書き換え、スタッフ名簿への書き足し、金額の書き換え など（全 20 通り）

## 動かし方

Java 21 以上が必要です（エミュレーターが使う）。

```bash
cd firestore-tests
npm install
npm test
```

## 手元でアプリごと試す（ログインとルールの両方）

エミュレーターを起動し、別のターミナルで、エミュレーターにつながる設定で `npm run dev` を起動します。
Google のログインは、エミュレーターの画面で好きなメールアドレスのアカウントを作って試せます。

```bash
# 1つめのターミナル
cd firestore-tests
npx firebase emulators:start --only auth,firestore --project demo-mealgo --config ../firebase.json

# 2つめのターミナル（リポジトリのルートで）
VITE_USE_FIREBASE_EMULATORS=1 VITE_LOGIN_DOMAIN=gl.pen-kanagawa.ed.jp VITE_PAYMENT_MODE=mock \
VITE_FIREBASE_API_KEY=demo-key VITE_FIREBASE_AUTH_DOMAIN=demo-mealgo.firebaseapp.com \
VITE_FIREBASE_PROJECT_ID=demo-mealgo VITE_FIREBASE_STORAGE_BUCKET=demo-mealgo.appspot.com \
VITE_FIREBASE_MESSAGING_SENDER_ID=1 VITE_FIREBASE_APP_ID=1:1:web:1 npm run dev
```

スタッフのアカウントは、エミュレーターに直接作ります（`staffMembers/{UID}` も作る）:

```bash
UID=$(curl -s -X POST "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key" \
  -H 'Content-Type: application/json' \
  -d '{"email":"kitchen@example.com","password":"Kitchen-Pass-2026!","returnSecureToken":true}' \
  | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).localId))")
curl -s -X PATCH "http://127.0.0.1:8080/v1/projects/demo-mealgo/databases/(default)/documents/staffMembers/$UID" \
  -H 'Authorization: Bearer owner' -H 'Content-Type: application/json' \
  -d '{"fields":{"name":{"stringValue":"厨房"}}}'
```

`VITE_USE_FIREBASE_EMULATORS` は `npm run dev` のときだけ効きます（本番のビルドには入りません）。
