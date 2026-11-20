// メニュー検索（副作用なし）。
// ひらがな・カタカナ・半角カナ・全角英数をそろえてから、名前・読み・説明の一部と比べる。
import type { MenuItem } from '@/data/menu'

/** 比べやすい形にそろえる（全角英数→半角、カタカナ→ひらがな、小文字、空白を除く） */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/\s+/g, '')
}

/** 見つかった商品（メニューの順のまま）。空の検索語なら何も返さない */
export function searchMenu(items: MenuItem[], query: string): MenuItem[] {
  const q = normalizeForSearch(query)
  if (!q) return []
  return items.filter((m) =>
    [m.name, m.yomi, m.description]
      .filter((t): t is string => Boolean(t))
      .some((t) => normalizeForSearch(t).includes(q)),
  )
}
