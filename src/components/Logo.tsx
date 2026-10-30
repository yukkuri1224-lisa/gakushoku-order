// mealgo（ミールゴー）のロゴ。いただいたロゴの白い背景を透明にした画像（public/brand/）。

/** 文字だけのロゴ（ヘッダー用） */
export function MealgoWordmark({ className = 'h-6' }: { className?: string }) {
  return <img src="/brand/mealgo-wordmark-96.png" alt="mealgo" className={`w-auto shrink-0 ${className}`} />
}

/** 「ミールゴー」の行も入ったロゴ（入口の画面用） */
export function MealgoLogo({ className = 'w-52' }: { className?: string }) {
  return <img src="/brand/mealgo-logo.png" alt="mealgo（ミールゴー）" className={`h-auto ${className}`} />
}
