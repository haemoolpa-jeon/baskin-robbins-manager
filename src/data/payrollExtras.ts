import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export const extraKeys = {
  month: (storeId: string, ym: string) => ['payroll_extras', storeId, ym] as const,
}

export interface Extra {
  amount: number
  note: string
}

interface ExtraRow {
  worker_id: number
  amount: number
  note: string
}

/** workerId -> { amount, note } for the month. */
export function usePayrollExtras(storeId: string | null, ym: string) {
  return useQuery({
    queryKey: extraKeys.month(storeId ?? '', ym),
    enabled: !!storeId,
    queryFn: async (): Promise<Map<number, Extra>> => {
      if (!storeId) return new Map()
      const { data, error } = await supabase
        .from('payroll_extras')
        .select('worker_id, amount, note')
        .eq('store_id', storeId)
        .eq('year_month', ym)
      if (error) throw error
      const map = new Map<number, Extra>()
      for (const r of data as ExtraRow[]) map.set(r.worker_id, { amount: r.amount, note: r.note })
      return map
    },
  })
}

export function useSetPayrollExtra(storeId: string | null, ym: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ workerId, amount, note }: { workerId: number; amount: number; note: string }) => {
      if (!storeId) throw new Error('매장이 선택되지 않았습니다')
      const { error } = await supabase.from('payroll_extras').upsert(
        { store_id: storeId, worker_id: workerId, year_month: ym, amount, note },
        { onConflict: 'store_id,worker_id,year_month' },
      )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: extraKeys.month(storeId ?? '', ym) }),
  })
}
