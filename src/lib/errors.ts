// 画面に出すエラー文言。Firebase などの英語のエラーをそのまま見せない。

const SETUP_MESSAGE =
  'お店のシステム設定に問題があります。スタッフにお知らせください。'

export function toUserMessage(e: unknown): string {
  if (!(e instanceof Error)) return 'エラーが発生しました'
  const code = (e as { code?: unknown }).code
  if (
    code === 'permission-denied' ||
    /insufficient permissions/i.test(e.message)
  ) {
    return SETUP_MESSAGE
  }
  return e.message
}
