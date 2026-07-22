import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@shared/lib/supabase'
import { MIN_WAGE_2026, type Worker } from '@/lib/types'

export const workerKeys = {
  all: ['workers'] as const,
  list: (storeId: string) => ['workers', storeId] as const,
}

interface WorkerRow {
  id: number
  name: string
  emoji: string
  wage: number
  tax_withholding: boolean
}

const mapWorker = (r: WorkerRow): Worker => ({
  id: r.id,
  name: r.name,
  emoji: r.emoji,
  wage: r.wage,
  taxWithholding: r.tax_withholding,
})

export function useWorkers(storeId: string | null) {
  return useQuery({
    queryKey: workerKeys.list(storeId ?? ''),
    enabled: !!storeId,
    queryFn: async (): Promise<Worker[]> => {
      if (!storeId) return []
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('store_id', storeId)
        .order('name')
      if (error) throw error
      return (data as WorkerRow[]).map(mapWorker)
    },
  })
}

export interface NewWorker {
  name: string
  emoji: string
  wage?: number
  taxWithholding?: boolean
}

export function useAddWorker(storeId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (w: NewWorker) => {
      const { data, error } = await supabase
        .from('workers')
        .insert({
          store_id: storeId,
          name: w.name,
          emoji: w.emoji,
          wage: w.wage ?? MIN_WAGE_2026,
          tax_withholding: w.taxWithholding ?? true,
        })
        .select()
        .single()
      if (error) throw error
      return mapWorker(data as WorkerRow)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: workerKeys.list(storeId ?? '') }),
  })
}

export function useUpdateWorker(storeId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (w: Partial<Worker> & { id: number }) => {
      const patch: Record<string, unknown> = {}
      if (w.name !== undefined) patch.name = w.name
      if (w.emoji !== undefined) patch.emoji = w.emoji
      if (w.wage !== undefined) patch.wage = w.wage
      if (w.taxWithholding !== undefined) patch.tax_withholding = w.taxWithholding
      const { error } = await supabase.from('workers').update(patch).eq('id', w.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: workerKeys.list(storeId ?? '') }),
  })
}

export function useDeleteWorker(storeId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('workers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: workerKeys.list(storeId ?? '') }),
  })
}
