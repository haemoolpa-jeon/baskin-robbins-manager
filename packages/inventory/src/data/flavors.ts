import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@shared/lib/supabase'
import type { Flavor, FlavorType } from '@/lib/types'

export const flavorKeys = { list: (storeId: string) => ['flavors', storeId] as const }

interface FlavorRow {
  id: number
  name: string
  color: string
  type: FlavorType
  available: boolean
  lot_number: string | null
  expiry_date: string | null
  storage_location: string | null
}

const mapFlavor = (r: FlavorRow): Flavor => ({
  id: r.id,
  name: r.name,
  color: r.color,
  type: r.type,
  available: r.available,
  lotNumber: r.lot_number ?? '',
  expiryDate: r.expiry_date,
  storageLocation: r.storage_location ?? '',
})

export function useFlavors(storeId: string | null) {
  return useQuery({
    queryKey: flavorKeys.list(storeId ?? ''),
    enabled: !!storeId,
    queryFn: async (): Promise<Flavor[]> => {
      if (!storeId) return []
      const { data, error } = await supabase
        .from('flavors')
        .select('*')
        .eq('store_id', storeId)
        .order('id')
      if (error) throw error
      return (data as FlavorRow[]).map(mapFlavor)
    },
  })
}

export interface NewFlavor {
  name: string
  color: string
  type: FlavorType
  lotNumber: string
  expiryDate: string | null
  storageLocation: string
}

export function useAddFlavor(storeId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (f: NewFlavor) => {
      const id = Date.now()
      const { error } = await supabase
        .from('flavors')
        .insert({
          id,
          store_id: storeId,
          name: f.name,
          color: f.color,
          type: f.type,
          lot_number: f.lotNumber || null,
          expiry_date: f.expiryDate || null,
          storage_location: f.storageLocation || '',
          available: true,
        })
      if (error) throw error
      return id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: flavorKeys.list(storeId ?? '') }),
  })
}

export function useUpdateFlavor(storeId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (f: Partial<Flavor> & { id: number }) => {
      const patch: Record<string, unknown> = {}
      if (f.name !== undefined) patch.name = f.name
      if (f.color !== undefined) patch.color = f.color
      if (f.type !== undefined) patch.type = f.type
      if (f.available !== undefined) patch.available = f.available
      if (f.lotNumber !== undefined) patch.lot_number = f.lotNumber || null
      if (f.expiryDate !== undefined) patch.expiry_date = f.expiryDate || null
      if (f.storageLocation !== undefined) patch.storage_location = f.storageLocation
      const { error } = await supabase.from('flavors').update(patch).eq('id', f.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: flavorKeys.list(storeId ?? '') }),
  })
}

export function useDeleteFlavor(storeId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (flavorId: number) => {
      // No DB FK on flavor_id, so clean up references explicitly.
      await supabase.from('storage').delete().eq('store_id', storeId).eq('flavor_id', flavorId)
      await supabase
        .from('cabinets')
        .update({ flavor_id: null, level: null })
        .eq('store_id', storeId)
        .eq('flavor_id', flavorId)
      const { error } = await supabase.from('flavors').delete().eq('id', flavorId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries(),
  })
}
