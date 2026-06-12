import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export const activityKeys = { list: (storeId: string) => ['activity', storeId] as const }

/** Change-history categories (drive the icon + filter in the history view). */
export type ActivityCategory = '재고' | '근무' | '급여' | '주문' | '설정'

export interface Activity {
  id: number | string
  message: string
  category: ActivityCategory
  at: number // epoch ms
}

interface LogRow {
  id: number | string
  message: string
  category: ActivityCategory
  created_at: string
}

export function useActivity(storeId: string | null) {
  return useQuery({
    queryKey: activityKeys.list(storeId ?? ''),
    enabled: !!storeId,
    queryFn: async (): Promise<Activity[]> => {
      if (!storeId) return []
      const { data, error } = await supabase
        .from('activity_log')
        .select('id, message, category, created_at')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(300)
      if (error) throw error
      return (data as LogRow[]).map((r) => ({
        id: r.id,
        message: r.message,
        category: r.category,
        at: new Date(r.created_at).getTime(),
      }))
    },
  })
}

/**
 * Returns a `log(message, category)` function that records a change to the
 * backend history. Fire-and-forget — a logging failure never blocks the action.
 */
export function useLog(storeId: string | null) {
  const qc = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({ message, category }: { message: string; category: ActivityCategory }) => {
      const { error } = await supabase.from('activity_log').insert({ store_id: storeId, message, category })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: activityKeys.list(storeId ?? '') }),
  })
  return useCallback(
    (message: string, category: ActivityCategory) => {
      if (storeId) mutation.mutate({ message, category })
    },
    [storeId, mutation],
  )
}
