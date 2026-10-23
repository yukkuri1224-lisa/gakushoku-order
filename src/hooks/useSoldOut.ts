// 今日の売り切れ商品（id の集合）を購読する。厨房で変えると、注文画面にすぐ反映される。
import { useEffect, useMemo, useState } from 'react'
import { getSoldOutRepository } from '@/lib/soldOut'
import { todayKey } from '@/lib/orders/types'

export function useSoldOut(): Set<string> {
  const [ids, setIds] = useState<string[]>([])
  useEffect(() => getSoldOutRepository().subscribe(todayKey(), setIds), [])
  return useMemo(() => new Set(ids), [ids])
}
