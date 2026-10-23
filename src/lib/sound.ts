// 通知音（Web Audio）。できあがりのお知らせ・厨房の新しい注文に使う。
// ブラウザは「画面を一度もタップしていないページ」から音を出させないため、
// 最初のタップで音の準備をしておく（installSoundUnlock）。準備前は「通知音をオンにする」ボタンを出す。
// 自動再生制限などで失敗してもアプリは止めない（ベストエフォート）。
let ctx: AudioContext | null = null
const listeners = new Set<() => void>()

function audioContext(): AudioContext | null {
  if (ctx) return ctx
  const AudioCtx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return null
  try {
    ctx = new AudioCtx()
    ctx.onstatechange = () => listeners.forEach((cb) => cb())
  } catch {
    ctx = null
  }
  return ctx
}

/** 音を鳴らせる状態か */
export function isSoundReady(): boolean {
  return ctx?.state === 'running'
}

/** 鳴らせる状態が変わったら知らせる（useSyncExternalStore 用） */
export function subscribeSound(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** タップなどの操作の中で呼ぶ。音の準備をする（iPhone 向けに無音を 1 回鳴らす） */
export function unlockSound(): void {
  const ac = audioContext()
  if (!ac) return
  try {
    void ac.resume()
    const src = ac.createBufferSource()
    src.buffer = ac.createBuffer(1, 1, 22050)
    src.connect(ac.destination)
    src.start(0)
  } catch {
    // 無視
  }
}

/** 最初のタップ・キー操作で音の準備をする（アプリ起動時に 1 回呼ぶ） */
export function installSoundUnlock(): void {
  const events = ['pointerdown', 'touchend', 'keydown'] as const
  const handler = () => {
    unlockSound()
    if (isSoundReady()) events.forEach((e) => window.removeEventListener(e, handler, true))
  }
  events.forEach((e) => window.addEventListener(e, handler, true))
}

function tone(ac: AudioContext, freq: number, start: number, duration: number): void {
  // 基音＋倍音で、やわらかいチャイムの音にする
  for (const [mult, level] of [
    [1, 0.22],
    [2, 0.06],
    [3, 0.025],
  ] as const) {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq * mult
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(level, start + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    osc.connect(gain).connect(ac.destination)
    osc.start(start)
    osc.stop(start + duration + 0.05)
  }
}

/** 「ピンポーン」を times 回ならす */
export function playChime(times = 1): void {
  const ac = audioContext()
  if (!ac) return
  try {
    if (ac.state === 'suspended') void ac.resume()
    let t = ac.currentTime + 0.05
    for (let i = 0; i < times; i++) {
      tone(ac, 659.25, t, 0.7) // ミ
      tone(ac, 523.25, t + 0.32, 1.1) // ド
      t += 1.5
    }
  } catch {
    // 無視
  }
}

export function vibrate(pattern: number | number[] = [120, 60, 120]): void {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // 無視
  }
}

/** テスト用：中の AudioContext を返す */
export function __audioContextForTest(): AudioContext | null {
  return ctx
}
