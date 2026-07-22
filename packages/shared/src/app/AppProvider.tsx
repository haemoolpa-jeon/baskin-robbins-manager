import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { useStore } from '@shared/data/store'

function currentYearMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

interface AppValue {
  storeId: string | null
  storeName: string
  defaultPar: number
  yearMonth: string
  setYearMonth: (ym: string) => void
  isLoading: boolean
  isError: boolean
}

const AppContext = createContext<AppValue | null>(null)

/** Single-store app context. No accounts, no roles — just the one store + the
 *  currently-viewed month. The store row is the source of name + default par. */
export function AppProvider({ children }: { children: ReactNode }) {
  const storeQ = useStore()
  const [yearMonth, setYearMonth] = useState<string>(currentYearMonth())

  const value = useMemo<AppValue>(
    () => ({
      storeId: storeQ.data?.id ?? null,
      storeName: storeQ.data?.name ?? '매장',
      defaultPar: storeQ.data?.defaultPar ?? 2,
      yearMonth,
      setYearMonth,
      isLoading: storeQ.isLoading,
      isError: storeQ.isError,
    }),
    [storeQ.data, storeQ.isLoading, storeQ.isError, yearMonth],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
