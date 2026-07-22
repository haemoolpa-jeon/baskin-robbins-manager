import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@shared/lib/supabase'
import type { Storage } from '@/lib/types'

export const storageKeys = { all: (storeId: string) => ['storage', storeId] as const }

interface StorageRow {
  flavor_id: number
  quantity: number
}

export function useStorage(storeId: string | null) {
  return useQuery({
    queryKey: storageKeys.all(storeId ?? ''),
    enabled: !!storeId,
    queryFn: async (): Promise<Storage> => {
      if (!storeId) return {}
      const { data, error } = await supabase
        .from('storage')
        .select('flavor_id, quantity')
        .eq('store_id', storeId)
      if (error) throw error
      const map: Storage = {}
      for (const r of data as StorageRow[]) map[r.flavor_id] = r.quantity
      return map
    },
  })
}

export function useSetStorage(storeId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ flavorId, quantity }: { flavorId: number; quantity: number }) => {
      if (!storeId) throw new Error('매장이 선택되지 않았습니다')
      const { error } = await supabase
        .from('storage')
        .upsert(
          { store_id: storeId, flavor_id: flavorId, quantity: Math.max(0, quantity) },
          { onConflict: 'store_id,flavor_id' },
        )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: storageKeys.all(storeId ?? '') }),
  })
}

export function useSetStorageBatch(storeId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (items: { flavorId: number; quantity: number }[]) => {
      if (!storeId) throw new Error('매장이 선택되지 않았습니다')
      if (items.length === 0) return
      const rows = items.map(({ flavorId, quantity }) => ({
        store_id: storeId,
        flavor_id: flavorId,
        quantity: Math.max(0, quantity),
      }))
      const { error } = await supabase.from('storage').upsert(rows, { onConflict: 'store_id,flavor_id' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: storageKeys.all(storeId ?? '') }),
  })
}
