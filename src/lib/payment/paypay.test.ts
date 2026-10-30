import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearPendingPayPayId, getPendingPayPayId, rememberPendingPayPayId } from './paypay'

beforeEach(() => {
  localStorage.clear()
  vi.useRealTimers()
})

describe('支払い中の PayPay の記録', () => {
  it('記録した支払いIDを読める。消したら null', () => {
    rememberPendingPayPayId('mp-1')
    expect(getPendingPayPayId()).toBe('mp-1')
    clearPendingPayPayId()
    expect(getPendingPayPayId()).toBeNull()
  })

  it('3 時間たった記録は、支払いをやめたものとして捨てる', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 30, 12, 0))
    rememberPendingPayPayId('mp-2')
    vi.setSystemTime(new Date(2026, 9, 30, 15, 1))
    expect(getPendingPayPayId()).toBeNull()
    expect(localStorage.getItem('paypay.mpid')).toBeNull()
    vi.useRealTimers()
  })
})
