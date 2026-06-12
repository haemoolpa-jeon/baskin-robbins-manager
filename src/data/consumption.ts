import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ConsumptionRecord } from '@/lib/types'

export const consumptionKeys = { all: (storeId: string) => ['consumption', storeId] as const }

interface SaleRow {
  flavor_id: number
  quantity: number
  sold_at: string
}

/** Tub-consumption history (a replaced/emptied tub = a unit consumed). */
export function useConsumption(storeId: string | null) {
  return useQuery({
    queryKey: consumptionKeys.all(storeId ?? ''),
    enabled: !!storeId,
    queryFn: async (): Promise<ConsumptionRecord[]> => {
      if (!storeId) return []
      const { data, error } = await supabase
        .from('sales')
        .select('flavor_id, quantity, sold_at')
        .eq('store_id', storeId)
        .order('sold_at', { ascending: false })
      if (error) throw error
      return (data as SaleRow[]).map((r) => ({
        flavorId: r.flavor_id,
        qty: r.quantity,
        date: new Date(r.sold_at).getTime(),
      }))
    },
  })
}

export function useRecordConsumption(storeId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ flavorId, qty = 1 }: { flavorId: number; qty?: number }) => {
      if (!storeId) throw new Error('매장이 선택되지 않았습니다')
      const { error } = await supabase
        .from('sales')
        .insert({ store_id: storeId, flavor_id: flavorId, quantity: qty })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: consumptionKeys.all(storeId ?? '') }),
  })
}
