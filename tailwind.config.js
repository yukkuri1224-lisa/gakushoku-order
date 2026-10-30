/** @type {import('tailwindcss').Config} */
// 色はここに定義したものだけを使う（設計書 3章「見た目のルール」）。
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1C1917', // 文字・メインボタン（墨）
          sub: '#57534E', // 補助文字
          faint: '#A8A29E', // 薄い文字
          line: '#E7E5E4', // 区切り線
        },
        surface: '#F5F5F4', // 薄い灰色の地
        cream: '#FBF7F2', // 画面の地（あたたかい白）
        // mealgo のロゴのオレンジ（#F57D03）と同じ系統。ロゴそのままの色は白文字が読みにくいため、
        // ボタン・価格は濃くした DEFAULT を使う
        brand: {
          DEFAULT: '#B35500', // メインボタン・価格・選択中。白文字とのコントラスト 5.0
          dark: '#8F4300', // 淡い地の上の文字
          soft: '#FFF4E6', // 淡い地（選択中のカード・ラベル）
          bright: '#F57D03', // ロゴのオレンジ。飾りだけ（文字には使わない）
        },
        accent: {
          bg: '#FDF3D7', // 小さなラベルの地（からし色）
          fg: '#7A5300', // 小さなラベルの文字
        },
        danger: '#B42318', // 注意・エラー
        success: '#15803D', // 完了
        paypay: '#FF0033', // PayPay ボタン（例外）
      },
      boxShadow: {
        sheet: '0 -8px 24px -12px rgba(28, 25, 23, 0.18)', // 下から開くシート・最下部のバー
        card: '0 1px 2px rgba(28, 25, 23, 0.05), 0 8px 24px -14px rgba(28, 25, 23, 0.22)', // 白いカード
        float: '0 10px 30px -10px rgba(143, 67, 0, 0.5)', // 浮いているボタン（カートへ進む）
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'sheet-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out both',
        'sheet-up': 'sheet-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pop-in': 'pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      },
    },
  },
  plugins: [],
}
