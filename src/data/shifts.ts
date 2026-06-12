import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { addMonths } from '@/lib/date'
import type { Shift } from '@/lib/types'

export const shiftKeys = {
  month: (storeId: string, ym: string) => ['shifts', storeId, ym] as const,
}

interface ShiftRow {
  id: string
  worker_id: number
  work_date: string
  start_min: number
  end_min: number
}

const mapShift = (r: ShiftRow): Shift => ({
  id: r.id,
  workerId: r.worker_id,
  workDate: r.work_date,
  startMin: r.start_min,
  endMin: r.end_min,
})

/** All shifts in the given month ('YYYY-MM'), for every worker in the store. */
export function useShifts(storeId: string | null, ym: string) {
  return useQuery({
    queryKey: shiftKeys.month(storeId ?? '', ym),
    enabled: !!storeId,
    queryFn: async (): Promise<Shift[]> => {
      if (!storeId) return []
      const firstIso = `${ym}-01`
      const nextFirstIso = `${addMonths(ym, 1)}-01`
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('store_id', storeId)
        .gte('work_date', firstIso)
        .lt('work_date', nextFirstIso)
        .order('work_date')
        .order('start_min')
      if (error) throw error
      return (data as ShiftRow[]).map(mapShift)
    },
  })
}

export function useAddShift(storeId: string | null, ym: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (s: { workerId: number; workDate: string; startMin: number; endMin: number }) => {
      if (!storeId) throw new Error('매장이 선택되지 않았습니다')
      const { error } = await supabase.from('shifts').insert({
        store_id: storeId,
        worker_id: s.workerId,
        work_date: s.workDate,
        start_min: s.startMin,
        end_min: s.endMin,
      })
      if (error) {
        if (error.code === '23505') throw new Error('같은 시작 시간의 근무가 이미 있습니다')
        throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: shiftKeys.month(storeId ?? '', ym) }),
  })
}

export function useDeleteShift(storeId: string | null, ym: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shifts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: shiftKeys.month(storeId ?? '', ym) }),
  })
}
