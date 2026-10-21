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
        accent: {
          bg: '#FDF3D7', // 小さなラベルの地（からし色）
          fg: '#7A5300', // 小さなラベルの文字
        },
        danger: '#B42318', // 注意・エラー
        success: '#15803D', // 完了
        paypay: '#FF0033', // PayPay ボタン（例外）
      },
      boxShadow: {
        // 影は下から開くシートと最下部の固定バーだけに使う
        sheet: '0 -8px 24px -12px rgba(28, 25, 23, 0.18)',
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
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out both',
        'sheet-up': 'sheet-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
}
