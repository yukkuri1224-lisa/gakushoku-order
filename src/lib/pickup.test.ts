import { describe, expect, it } from 'vitest'
import { dueAt, formatPickup, isPickupValid, pickupSlots } from './pickup'

// 2026/11/20（金）の、手元の時刻で
const at = (h: number, m: number) => new Date(2026, 10, 20, h, m)

describe('受け取り時間の予約', () => {
  it('今から15分あと以降の、15分きざみの時間を、食堂が閉まるまで選べる', () => {
    const slots = pickupSlots(at(11, 7))
    expect(formatPickup(slots[0])).toBe('11:30')
    expect(formatPickup(slots[1])).toBe('11:45')
    expect(formatPickup(slots[slots.length - 1])).toBe('19:30')
    expect(slots).toHaveLength(33)
  })

  it('開く前なら、開く時間から選べる', () => {
    expect(formatPickup(pickupSlots(at(8, 0))[0])).toBe('10:30')
  })

  it('閉まる直前・閉まったあとは選べない（できしだいだけ）', () => {
    expect(pickupSlots(at(19, 20))).toEqual([])
    expect(pickupSlots(at(21, 0))).toEqual([])
  })

  it('選んだ時間がもう過ぎていたり、きざみに合わなければ使えない', () => {
    const now = at(11, 7)
    expect(isPickupValid(at(12, 30).getTime(), now)).toBe(true)
    expect(isPickupValid(at(11, 15).getTime(), now)).toBe(false)
    expect(isPickupValid(at(12, 31).getTime(), now)).toBe(false)
    expect(isPickupValid(new Date(2026, 10, 21, 12, 30).getTime(), now)).toBe(false)
  })

  it('厨房では、予約は受け取りの15分前、ほかは注文した時刻の順に並べる', () => {
    expect(dueAt({ createdAt: at(11, 0).getTime() })).toBe(at(11, 0).getTime())
    expect(dueAt({ createdAt: at(11, 0).getTime(), pickupAt: at(12, 30).getTime() })).toBe(
      at(12, 15).getTime(),
    )
  })
})
