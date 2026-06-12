import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export const storeKeys = { single: ['store'] as const }

export interface Store {
  id: string
  name: string
  defaultPar: number // 목표 재고 (맛별 유지 통 수)
}

interface StoreRow {
  id: string
  name: string
  default_par: number | null
}

/** This is a single-store app — fetch the one store row. */
export function useStore() {
  return useQuery({
    queryKey: storeKeys.single,
    queryFn: async (): Promise<Store> => {
      const { data, error } = await supabase.from('stores').select('*').limit(1).single()
      if (error) throw error
      const r = data as StoreRow
      return { id: r.id, name: r.name, defaultPar: r.default_par ?? 2 }
    },
  })
}

export function useRenameStore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('stores').update({ name }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: storeKeys.single }),
  })
}

export function useSetDefaultPar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, par }: { id: string; par: number }) => {
      const { error } = await supabase.from('stores').update({ default_par: Math.max(0, par) }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: storeKeys.single }),
  })
}
