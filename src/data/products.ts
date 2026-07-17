import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { InventoryProduct, ProductCategory } from '@/lib/types'

export const productKeys = { list: (storeId: string) => ['inventory-products', storeId] as const }

interface ProductRow {
  id: number
  name: string
  category: ProductCategory
  subtype: string
  quantity: number
  par: number
  unit: string
  size_label: string
  location: string
  expiry_date: string | null
  pack_size: number | null
  available: boolean
}

export function useProducts(storeId: string | null) {
  return useQuery({
    queryKey: productKeys.list(storeId ?? ''),
    enabled: !!storeId,
    queryFn: async (): Promise<InventoryProduct[]> => {
      if (!storeId) return []
      const { data, error } = await supabase
        .from('inventory_products')
        .select('id, name, category, subtype, quantity, par, unit, size_label, location, expiry_date, pack_size, available')
        .eq('store_id', storeId)
        .order('category')
        .order('subtype')
        .order('name')
      if (error) throw error
      return (data as ProductRow[]).map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        subtype: row.subtype || 'other',
        quantity: row.quantity ?? 0,
        par: row.par ?? 0,
        unit: row.unit || '개',
        sizeLabel: row.size_label || '',
        location: row.location || '',
        expiryDate: row.expiry_date,
        packSize: row.pack_size,
        available: row.available,
      }))
    },
  })
}

export function useSaveProduct(storeId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (product: Omit<InventoryProduct, 'id'> & { id?: number }) => {
      if (!storeId) throw new Error('매장이 선택되지 않았습니다')
      const row = {
        id: product.id ?? Date.now(),
        store_id: storeId,
        name: product.name.trim(),
        category: product.category,
        subtype: product.subtype,
        quantity: Math.max(0, product.quantity),
        par: Math.max(0, product.par),
        unit: product.unit.trim() || '개',
        size_label: product.sizeLabel.trim(),
        location: product.location.trim(),
        expiry_date: product.expiryDate || null,
        pack_size: product.packSize && product.packSize > 0 ? Math.floor(product.packSize) : null,
        available: product.available,
      }
      const { error } = await supabase.from('inventory_products').upsert(row, { onConflict: 'id' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.list(storeId ?? '') }),
  })
}

export function useSetProductQuantities(storeId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (items: { id: number; quantity: number }[]) => {
      if (!storeId) throw new Error('매장이 선택되지 않았습니다')
      await Promise.all(
        items.map(async ({ id, quantity }) => {
          const { error } = await supabase
            .from('inventory_products')
            .update({ quantity: Math.max(0, quantity) })
            .eq('store_id', storeId)
            .eq('id', id)
          if (error) throw error
        }),
      )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.list(storeId ?? '') }),
  })
}

export function useDeleteProduct(storeId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      if (!storeId) throw new Error('매장이 선택되지 않았습니다')
      const { error } = await supabase.from('inventory_products').delete().eq('store_id', storeId).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.list(storeId ?? '') }),
  })
}
