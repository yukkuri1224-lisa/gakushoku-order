import { beforeEach, describe, expect, it } from 'vitest'
import { useDiningStore } from './dining'

beforeEach(() => {
  localStorage.clear()
  useDiningStore.setState({ option: null })
})

describe('useDiningStore', () => {
  it('最初は未選択', () => {
    expect(useDiningStore.getState().option).toBeNull()
  })

  it('選んだ利用方法を localStorage に残す（PayPay から別タブで戻っても消えない）', () => {
    useDiningStore.getState().setOption('takeout')
    expect(useDiningStore.getState().option).toBe('takeout')
    expect(localStorage.getItem('gakushoku.dining')).toContain('takeout')
  })
})
