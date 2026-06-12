import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Cabinets, CabinetName, RowName, Slot } from '@/lib/types'

export const cabinetKeys = { all: (storeId: string) => ['cabinets', storeId] as const }

const CAB_NAMES: CabinetName[] = ['cab1', 'cab2']
const ROW_NAMES: RowName[] = ['top', 'bottom']
export const SLOTS_PER_ROW = 16

function emptyCabinets(): Cabinets {
  const make = () => ({
    top: Array<Slot | null>(SLOTS_PER_ROW).fill(null),
    bottom: Array<Slot | null>(SLOTS_PER_ROW).fill(null),
  })
  return { cab1: make(), cab2: make() }
}

interface CabRow {
  cabinet_name: CabinetName
  row_name: RowName
  position: number
  flavor_id: number | null
  level: number | null
}

export function useCabinets(storeId: string | null) {
  return useQuery({
    queryKey: cabinetKeys.all(storeId ?? ''),
    enabled: !!storeId,
    queryFn: async (): Promise<Cabinets> => {
      if (!storeId) return emptyCabinets()
      const { data, error } = await supabase.from('cabinets').select('*').eq('store_id', storeId)
      if (error) throw error
      const cabs = emptyCabinets()
      for (const r of data as CabRow[]) {
        if (
          r.flavor_id != null &&
          CAB_NAMES.includes(r.cabinet_name) &&
          ROW_NAMES.includes(r.row_name) &&
          r.position >= 0 &&
          r.position < SLOTS_PER_ROW
        ) {
          cabs[r.cabinet_name][r.row_name][r.position] = { flavorId: r.flavor_id, level: r.level ?? 0 }
        }
      }
      return cabs
    },
  })
}

export interface SlotPos {
  cabinet: CabinetName
  row: RowName
  position: number
}

async function writeSlot(storeId: string, pos: SlotPos, slot: Slot | null) {
  const { error } = await supabase.from('cabinets').upsert(
    {
      store_id: storeId,
      cabinet_name: pos.cabinet,
      row_name: pos.row,
      position: pos.position,
      flavor_id: slot?.flavorId ?? null,
      level: slot?.level ?? null,
    },
    { onConflict: 'store_id,cabinet_name,row_name,position' },
  )
  if (error) throw error
}

export function useSetSlot(storeId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ pos, slot }: { pos: SlotPos; slot: Slot | null }) => {
      if (!storeId) throw new Error('매장이 선택되지 않았습니다')
      await writeSlot(storeId, pos, slot)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: cabinetKeys.all(storeId ?? '') }),
  })
}

export function useSwapSlots(storeId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      a,
      b,
      slotA,
      slotB,
    }: {
      a: SlotPos
      b: SlotPos
      slotA: Slot | null
      slotB: Slot | null
    }) => {
      if (!storeId) throw new Error('매장이 선택되지 않았습니다')
      // Swap: position a gets slotB, position b gets slotA.
      await writeSlot(storeId, a, slotB)
      await writeSlot(storeId, b, slotA)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: cabinetKeys.all(storeId ?? '') }),
  })
}
