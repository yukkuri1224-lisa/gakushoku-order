import { beforeEach, describe, expect, it } from 'vitest'
import { LocalSoldOutRepository } from './local'

beforeEach(() => {
  localStorage.clear()
})

function current(repo: LocalSoldOutRepository, day: string): string[] {
  let ids: string[] = []
  const unsub = repo.subscribe(day, (next) => {
    ids = next
  })
  unsub()
  return ids
}

describe('LocalSoldOutRepository（売り切れ）', () => {
  it('最初は売り切れなし', () => {
    expect(current(new LocalSoldOutRepository(), '2026-10-23')).toEqual([])
  })

  it('売り切れにした商品が届き、販売再開で消える', async () => {
    const repo = new LocalSoldOutRepository()
    const seen: string[][] = []
    const unsub = repo.subscribe('2026-10-23', (ids) => seen.push(ids))
    await repo.setSoldOut('2026-10-23', 'takoyaki', true)
    await repo.setSoldOut('2026-10-23', 'curry', true)
    await repo.setSoldOut('2026-10-23', 'takoyaki', false)
    unsub()
    expect(seen.at(-1)).toEqual(['curry'])
  })

  it('同じ商品を2回売り切れにしても1つだけ', async () => {
    const repo = new LocalSoldOutRepository()
    await repo.setSoldOut('2026-10-23', 'curry', true)
    await repo.setSoldOut('2026-10-23', 'curry', true)
    expect(current(repo, '2026-10-23')).toEqual(['curry'])
  })

  it('売り切れはその日だけ（次の日は販売中に戻る）', async () => {
    const repo = new LocalSoldOutRepository()
    await repo.setSoldOut('2026-10-23', 'curry', true)
    expect(current(repo, '2026-10-24')).toEqual([])
  })
})
