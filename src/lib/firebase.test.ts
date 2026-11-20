import { describe, expect, it } from 'vitest'
import { toHost } from './firebase'

describe('Firebase の authDomain', () => {
  it('コピーのときに付いた http(s):// や末尾の / ・空白を取り除く', () => {
    expect(toHost('http://mobileorder-5f178.firebaseapp.com/')).toBe('mobileorder-5f178.firebaseapp.com')
    expect(toHost(' https://mobileorder-5f178.firebaseapp.com ')).toBe('mobileorder-5f178.firebaseapp.com')
    expect(toHost('"mobileorder-5f178.firebaseapp.com",')).toBe('mobileorder-5f178.firebaseapp.com')
  })

  it('正しい値はそのまま', () => {
    expect(toHost('mobileorder-5f178.firebaseapp.com')).toBe('mobileorder-5f178.firebaseapp.com')
    expect(toHost(undefined)).toBeUndefined()
  })
})
