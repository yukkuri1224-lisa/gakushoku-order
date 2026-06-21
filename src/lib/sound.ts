// 通知音（Web Audio）。完了通知・新規注文のビープに使う。
// 自動再生制限などで失敗してもアプリは止めない（ベストエフォート）。
let ctx: AudioContext | null = null

export function beep(times = 2): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    ctx = ctx ?? new AudioCtx()
    const ac = ctx
    let t = ac.currentTime
    for (let i = 0; i < times; i++) {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.2, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
      osc.connect(gain).connect(ac.destination)
      osc.start(t)
      osc.stop(t + 0.2)
      t += 0.25
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
