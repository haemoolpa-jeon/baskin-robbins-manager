import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@shared/lib/supabase'
import { isoDate } from '@shared/lib/date'
import { storageKeys } from '@/data/storage'
import { productKeys } from '@/data/products'
import type { InventoryProduct, Storage } from '@/lib/types'

export type SnapshotItemType = 'storage' | 'product'

export interface SnapshotRow {
  itemType: SnapshotItemType
  itemId: number
  quantity: number
}

interface SnapshotDBRow {
  item_type: SnapshotItemType
  item_id: number
  quantity: number
}

export const snapshotKeys = {
  dates: (storeId: string) => ['snapshot-dates', storeId] as const,
  day: (storeId: string, date: string) => ['snapshot', storeId, date] as const,
}

export function todayIso(): string {
  return isoDate(new Date())
}

/** Set of 'YYYY-MM-DD' that have at least one snapshot row (for calendar marks). */
export function useSnapshotDates(storeId: string | null) {
  return useQuery({
    queryKey: snapshotKeys.dates(storeId ?? ''),
    enabled: !!storeId,
    queryFn: async (): Promise<Set<string>> => {
      if (!storeId) return new Set()
      const { data, error } = await supabase
        .from('inventory_snapshots')
        .select('snapshot_date')
        .eq('store_id', storeId)
      if (error) throw error
      // No DISTINCT in the demo backend — dedupe in JS.
      return new Set((data as { snapshot_date: string }[]).map((r) => r.snapshot_date))
    },
  })
}

/** All snapshot rows for one day. */
export function useSnapshot(storeId: string | null, date: string | null) {
  return useQuery({
    queryKey: snapshotKeys.day(storeId ?? '', date ?? ''),
    enabled: !!storeId && !!date,
    queryFn: async (): Promise<SnapshotRow[]> => {
      if (!storeId || !date) return []
      const { data, error } = await supabase
        .from('inventory_snapshots')
        .select('item_type, item_id, quantity')
        .eq('store_id', storeId)
        .eq('snapshot_date', date)
      if (error) throw error
      return (data as SnapshotDBRow[]).map((r) => ({
        itemType: r.item_type,
        itemId: r.item_id,
        quantity: r.quantity,
      }))
    },
  })
}

/** Write (upsert) a full snapshot of current on-hand quantities for a given day
 *  (default today). Idempotent on (store, date, item) so re-runs just update. */
export function useWriteSnapshot(storeId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      storage,
      products,
      date,
    }: {
      storage: Storage
      products: InventoryProduct[]
      date?: string
    }) => {
      if (!storeId) return
      const snapshotDate = date ?? todayIso()
      const rows = [
        ...Object.entries(storage).map(([flavorId, quantity]) => ({
          store_id: storeId,
          snapshot_date: snapshotDate,
          item_type: 'storage' as const,
          item_id: Number(flavorId),
          quantity: Math.max(0, quantity),
        })),
        ...products.map((product) => ({
          store_id: storeId,
          snapshot_date: snapshotDate,
          item_type: 'product' as const,
          item_id: product.id,
          quantity: Math.max(0, product.quantity),
        })),
      ]
      if (rows.length === 0) return
      const { error } = await supabase
        .from('inventory_snapshots')
        .upsert(rows, { onConflict: 'store_id,snapshot_date,item_type,item_id' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: snapshotKeys.dates(storeId ?? '') }),
  })
}

/** Restore current inventory to a chosen day's snapshot (writes quantities back
 *  into storage + inventory_products). Caller should snapshot current state first. */
export function useRestoreSnapshot(storeId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (rows: SnapshotRow[]) => {
      if (!storeId) throw new Error('매장이 선택되지 않았습니다')
      const storageRows = rows
        .filter((r) => r.itemType === 'storage')
        .map((r) => ({ store_id: storeId, flavor_id: r.itemId, quantity: Math.max(0, r.quantity) }))
      if (storageRows.length) {
        const { error } = await supabase
          .from('storage')
          .upsert(storageRows, { onConflict: 'store_id,flavor_id' })
        if (error) throw error
      }
      const productRows = rows.filter((r) => r.itemType === 'product')
      await Promise.all(
        productRows.map(async (r) => {
          const { error } = await supabase
            .from('inventory_products')
            .update({ quantity: Math.max(0, r.quantity) })
            .eq('store_id', storeId)
            .eq('id', r.itemId)
          if (error) throw error
        }),
      )
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: storageKeys.all(storeId ?? '') })
      qc.invalidateQueries({ queryKey: productKeys.list(storeId ?? '') })
    },
  })
}
