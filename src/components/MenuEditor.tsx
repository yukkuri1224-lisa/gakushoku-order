import { useEffect, useRef, useState } from 'react'
import { MENU_CATEGORIES, MENU_IMAGES, OPTION_PRESETS, type MenuItem } from '@/data/menu'
import { MenuThumb } from '@/components/MenuThumb'
import { CloseIcon } from '@/components/icons'
import { validateMenuInput, yomiFromName, type MenuInputErrors } from '@/lib/menu'
import { resizeImageToDataUrl } from '@/lib/resizeImage'
import {
  deleteMenuItem,
  moveMenuItem,
  newMenuItemId,
  saveMenuItem,
  useMenu,
} from '@/store/menu'

// 厨房ボードの「メニュー」タブ。メニューの追加・変更・削除・並べ替え・表示しない。
// 変更はすぐ学生のメニューに反映される（Firestore の menuItems。書けるのはスタッフだけ）。

/** 付け外しできる選択肢の説明 */
const OPTION_LABEL: Record<string, string> = {
  noodle: 'うどん・そばを選ぶ',
  size: '大盛りを選べる（+150円）',
  negi: 'ネギ抜きを選べる',
  fukujinzuke: '福神漬けのあり・なしを選べる',
}

const SAVE_ERROR = '保存できませんでした。通信状態と、スタッフとしてログインしているかを確かめてください。'

export function MenuEditor() {
  const menu = useMenu()
  const [editing, setEditing] = useState<{ item: MenuItem | null } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const move = async (id: string, dir: -1 | 1) => {
    setError(null)
    try {
      await moveMenuItem(id, dir)
    } catch (e) {
      console.warn(e)
      setError(SAVE_ERROR)
    }
  }

  return (
    <section aria-label="メニュー管理">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-sub">変更は、すぐ学生のメニューに反映されます。</p>
        <button
          type="button"
          onClick={() => setEditing({ item: null })}
          className="h-11 rounded-full bg-brand px-5 text-sm font-bold text-white shadow-float"
        >
          ＋ メニューを追加
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-4 py-3 text-sm font-bold text-danger">
          {error}
        </p>
      )}

      {MENU_CATEGORIES.map((cat) => {
        const list = menu.filter((m) => m.category === cat)
        return (
          <section key={cat} className="pt-5">
            <h2 className="flex items-baseline gap-2 pb-2 text-base font-bold">
              {cat}
              <span className="text-[13px] font-normal tabular-nums text-ink-sub">{list.length}品</span>
            </h2>
            {list.length === 0 ? (
              <p className="text-sm text-ink-sub">まだありません</p>
            ) : (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {list.map((m, i) => (
                  <li
                    key={m.id}
                    className="flex min-w-0 items-center gap-2 rounded-2xl bg-white p-2.5 shadow-card"
                  >
                    <MenuThumb item={m} className={`h-12 w-12 ${m.hidden ? 'opacity-40' : ''}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`truncate font-bold ${m.hidden ? 'text-ink-sub' : ''}`}>{m.name}</p>
                      <p className="flex items-center gap-2 text-sm tabular-nums text-ink-sub">
                        ¥{m.price.toLocaleString()}
                        {m.unit && ` / ${m.unit}`}
                        {m.hidden && (
                          <span className="rounded bg-surface px-1.5 text-xs font-bold text-ink-sub">非表示</span>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`${m.name}を上へ`}
                      disabled={i === 0}
                      onClick={() => void move(m.id, -1)}
                      className="flex h-10 w-9 shrink-0 items-center justify-center rounded-full text-lg text-ink-sub disabled:opacity-25"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label={`${m.name}を下へ`}
                      disabled={i === list.length - 1}
                      onClick={() => void move(m.id, 1)}
                      className="flex h-10 w-9 shrink-0 items-center justify-center rounded-full text-lg text-ink-sub disabled:opacity-25"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      aria-label={`${m.name}を編集`}
                      onClick={() => setEditing({ item: m })}
                      className="h-10 shrink-0 rounded-full border border-ink-line px-3 text-sm font-bold"
                    >
                      編集
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}

      {editing && (
        <MenuItemForm
          key={editing.item?.id ?? 'new'}
          item={editing.item}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}

/** 1 品の編集（新しい商品は item = null） */
function MenuItemForm({ item, onClose }: { item: MenuItem | null; onClose: () => void }) {
  const [name, setName] = useState(item?.name ?? '')
  const [yomi, setYomi] = useState(item?.yomi ?? '')
  const [price, setPrice] = useState(item ? String(item.price) : '')
  const [category, setCategory] = useState(item?.category ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [badge, setBadge] = useState(item?.badge ?? '')
  const [unit, setUnit] = useState(item?.unit ?? '')
  const [image, setImage] = useState(item?.image ?? '')
  const [options, setOptions] = useState<string[]>(item?.optionGroups?.map((g) => g.id) ?? [])
  const [hidden, setHidden] = useState(item?.hidden ?? false)
  const [errors, setErrors] = useState<MenuInputErrors>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const save = async () => {
    const found = validateMenuInput({ name, price, category })
    setErrors(found)
    if (Object.keys(found).length > 0) return
    const trimmed = name.trim()
    const next: MenuItem = {
      id: item?.id ?? newMenuItemId(),
      name: trimmed,
      price: Number(price.trim()),
      category,
      ...(yomi.trim() || yomiFromName(trimmed) ? { yomi: yomi.trim() || yomiFromName(trimmed) } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(image ? { image } : {}),
      ...(badge.trim() ? { badge: badge.trim() } : {}),
      ...(unit.trim() ? { unit: unit.trim() } : {}),
      ...(options.length > 0
        ? { optionGroups: OPTION_PRESETS.filter((g) => options.includes(g.id)) }
        : {}),
      ...(hidden ? { hidden: true } : {}),
    }
    setBusy(true)
    setSaveError(null)
    try {
      await saveMenuItem(next)
      onClose()
    } catch (e) {
      console.warn(e)
      setSaveError(SAVE_ERROR)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!item) return
    setBusy(true)
    setSaveError(null)
    try {
      await deleteMenuItem(item.id)
      onClose()
    } catch (e) {
      console.warn(e)
      setSaveError(SAVE_ERROR)
    } finally {
      setBusy(false)
    }
  }

  const upload = async (file: File | undefined) => {
    if (!file) return
    try {
      setImage(await resizeImageToDataUrl(file))
    } catch {
      setSaveError('この写真は使えませんでした。ほかの写真を選んでください。')
    }
  }

  const fieldClass =
    'mt-1 h-12 w-full rounded-xl border bg-white px-3 text-base outline-none focus:border-ink'
  const errorText = (msg?: string) =>
    msg && <p className="mt-1 text-sm font-bold text-danger">{msg}</p>

  return (
    <div className="fixed inset-0 z-40 flex animate-fade-in items-end justify-center bg-black/45 sm:items-center" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={item ? `${item.name}の編集` : 'メニューの追加'}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-lg animate-sheet-up flex-col overflow-hidden rounded-t-3xl bg-white shadow-sheet outline-none sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-ink-line px-5 py-3">
          <h2 className="text-lg font-bold">{item ? 'メニューの編集' : 'メニューの追加'}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-cream"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="text-sm font-bold">名前</span>
            <input
              id="menu-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(errors.name)}
              className={`${fieldClass} ${errors.name ? 'border-danger' : 'border-ink-line'}`}
            />
            {errorText(errors.name)}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-bold">値段（円・税込）</span>
              <input
                id="menu-price"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                aria-invalid={Boolean(errors.price)}
                className={`${fieldClass} tabular-nums ${errors.price ? 'border-danger' : 'border-ink-line'}`}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold">ジャンル</span>
              <select
                id="menu-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-invalid={Boolean(errors.category)}
                className={`${fieldClass} ${errors.category ? 'border-danger' : 'border-ink-line'}`}
              >
                <option value="" disabled>
                  選んでください
                </option>
                {MENU_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {errorText(errors.price)}
          {errorText(errors.category)}

          <fieldset>
            <legend className="text-sm font-bold">選べるもの</legend>
            <div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
              {OPTION_PRESETS.map((g) => (
                <label key={g.id} className="flex min-h-11 items-center gap-2 text-[15px]">
                  <input
                    type="checkbox"
                    value={g.id}
                    checked={options.includes(g.id)}
                    onChange={(e) =>
                      setOptions((o) => (e.target.checked ? [...o, g.id] : o.filter((x) => x !== g.id)))
                    }
                    className="h-5 w-5 accent-brand"
                  />
                  {OPTION_LABEL[g.id] ?? g.label}
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-ink-sub">お持ち帰りの容器（下20円・上10円）は、ホットスナック以外に自動で付きます。</p>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-bold">画像</legend>
            <div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-7">
              <button
                type="button"
                aria-pressed={image === ''}
                onClick={() => setImage('')}
                className={`flex aspect-square items-center justify-center rounded-xl border text-xs text-ink-sub ${
                  image === '' ? 'border-brand ring-2 ring-brand' : 'border-ink-line'
                }`}
              >
                なし
              </button>
              {image.startsWith('data:') && (
                <button
                  type="button"
                  aria-pressed
                  aria-label="アップロードした写真"
                  className="aspect-square overflow-hidden rounded-xl border border-brand ring-2 ring-brand"
                >
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              )}
              {MENU_IMAGES.map((src) => (
                <button
                  key={src}
                  type="button"
                  aria-pressed={image === src}
                  aria-label={`画像 ${src.split('/').pop()}`}
                  onClick={() => setImage(src)}
                  className={`aspect-square overflow-hidden rounded-xl border bg-white ${
                    image === src ? 'border-brand ring-2 ring-brand' : 'border-ink-line'
                  }`}
                >
                  <img src={src} alt="" loading="lazy" className="h-full w-full object-contain p-0.5" />
                </button>
              ))}
            </div>
            <label className="mt-2 inline-flex h-11 cursor-pointer items-center rounded-full border border-ink-line px-4 text-sm font-bold">
              写真をアップロード
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => void upload(e.target.files?.[0])}
              />
            </label>
          </fieldset>

          <label className="block">
            <span className="text-sm font-bold">説明（なくてもよい）</span>
            <textarea
              id="menu-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={60}
              className="mt-1 w-full rounded-xl border border-ink-line bg-white px-3 py-2 text-base outline-none focus:border-ink"
            />
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="text-sm font-bold">ラベル</span>
              <input
                id="menu-badge"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                maxLength={8}
                placeholder="日替わり"
                className={`${fieldClass} border-ink-line`}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold">単位</span>
              <input
                id="menu-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                maxLength={6}
                placeholder="1個"
                className={`${fieldClass} border-ink-line`}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold">読み</span>
              <input
                id="menu-yomi"
                value={yomi}
                onChange={(e) => setYomi(e.target.value)}
                placeholder="おやこどん"
                className={`${fieldClass} border-ink-line`}
              />
            </label>
          </div>
          <p className="-mt-2 text-xs text-ink-sub">読み（ひらがな）を入れると、検索で見つかりやすくなります。</p>

          <label className="flex min-h-11 items-center gap-2 text-[15px] font-bold">
            <input
              id="menu-hidden"
              type="checkbox"
              checked={hidden}
              onChange={(e) => setHidden(e.target.checked)}
              className="h-5 w-5 accent-brand"
            />
            メニューに出さない（しばらく販売しないとき）
          </label>

          {saveError && (
            <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-bold text-danger">
              {saveError}
            </p>
          )}
        </div>

        <div className="pb-safe flex shrink-0 items-center gap-2 border-t border-ink-line px-5 pt-3">
          {item &&
            (confirmDelete ? (
              <button
                type="button"
                onClick={() => void remove()}
                disabled={busy}
                className="h-12 rounded-full bg-danger px-4 text-sm font-bold text-white"
              >
                本当に削除する
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="h-12 rounded-full px-3 text-sm font-bold text-danger"
              >
                削除
              </button>
            ))}
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy}
            className="ml-auto h-12 min-w-28 rounded-full bg-brand px-6 text-base font-bold text-white disabled:opacity-60"
          >
            {busy ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
