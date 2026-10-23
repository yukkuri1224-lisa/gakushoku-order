import { afterEach, describe, expect, it, vi } from 'vitest'

// AudioContext の代わり（jsdom には無い）。resume() で running になり statechange を出す
class FakeAudioContext {
  state: 'suspended' | 'running' = 'suspended'
  currentTime = 0
  destination = {}
  onstatechange: (() => void) | null = null
  oscillators = 0
  resume = vi.fn(async () => {
    this.state = 'running'
    this.onstatechange?.()
  })
  createBuffer() {
    return {}
  }
  createBufferSource() {
    return { buffer: null, connect: () => {}, start: () => {} }
  }
  createOscillator() {
    this.oscillators++
    return { type: '', frequency: { value: 0 }, connect: (n: unknown) => n, start: () => {}, stop: () => {} }
  }
  createGain() {
    return {
      gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      connect: (n: unknown) => n,
    }
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

async function load() {
  vi.stubGlobal('AudioContext', FakeAudioContext)
  return import('./sound')
}

describe('通知音', () => {
  it('タップするまでは鳴らせない状態で、タップで鳴らせるようになる', async () => {
    const sound = await load()
    sound.installSoundUnlock()
    expect(sound.isSoundReady()).toBe(false)
    const changed = vi.fn()
    sound.subscribeSound(changed)
    window.dispatchEvent(new Event('pointerdown'))
    await Promise.resolve()
    expect(sound.isSoundReady()).toBe(true)
    expect(changed).toHaveBeenCalled()
  })

  it('チャイムは「ピンポーン」の 2 音を回数分ならす', async () => {
    const sound = await load()
    sound.unlockSound()
    sound.playChime(2)
    const ctx = sound.__audioContextForTest() as unknown as FakeAudioContext
    expect(ctx.oscillators).toBeGreaterThanOrEqual(4)
  })
})
