// ---------------------------------------------------------------------------
// Domain types (camelCase, app-facing). DB rows are snake_case and mapped to
// these in the data hooks (src/data/*). Keeping one canonical shape here is the
// guardrail that the legacy JS lacked — the shift/payroll bugs were shape drift.
// ---------------------------------------------------------------------------

export type Role = 'owner' | 'manager' | 'parttime'

export type FlavorType = 'fixed' | 'seasonal' | 'limited' | 'special'

export interface Flavor {
  id: number
  name: string
  color: string
  type: FlavorType
  available: boolean
}

/** One occupied cabinet position. `null` = empty slot. */
export interface Slot {
  flavorId: number
  level: number // 0–100 (% remaining)
}

export type CabinetName = 'cab1' | 'cab2'
export type RowName = 'top' | 'bottom'

/** cab[name][row] is a fixed-length array of 16 (Slot | null). */
export type Cabinets = Record<CabinetName, Record<RowName, (Slot | null)[]>>

/** flavorId -> tub count in 창고 */
export type Storage = Record<number, number>

export interface Worker {
  id: number
  name: string
  emoji: string
  wage: number
  /** 사업소득세 3.3% 적용 여부 */
  taxWithholding: boolean
}

/** A single worked shift on a concrete calendar date. Times are minutes from
 *  midnight (09:00 = 540, 09:30 = 570) so half-hours survive round-trips. */
export interface Shift {
  id: string
  workerId: number
  workDate: string // 'YYYY-MM-DD'
  startMin: number
  endMin: number
}

/** 초과/기타(C) — a manual per-worker, per-month payroll adjustment. */
export interface PayrollExtra {
  workerId: number
  yearMonth: string // 'YYYY-MM'
  amount: number
  note: string
}

/** A tub-consumption record (legacy "sales" — a replaced/emptied tub). */
export interface ConsumptionRecord {
  flavorId: number
  qty: number
  date: number // epoch ms
}

export interface User {
  id: string
  name: string
  role: Role
  workerId: number | null
}

export interface Store {
  id: string
  name: string
}

export interface StoreLink {
  storeId: string
  role: Role
  store: Store
}

export const FLAVOR_TYPE_ORDER: FlavorType[] = ['fixed', 'seasonal', 'limited', 'special']

export const FLAVOR_TYPE_LABELS: Record<FlavorType, string> = {
  fixed: '🔵 상시',
  seasonal: '🟠 시즌',
  limited: '🔴 한정',
  special: '🟣 스페셜',
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: '👑 점주',
  manager: '🏷️ 매니저',
  parttime: '👤 알바',
}

/** 2026 최저시급 — default wage for new workers. */
export const MIN_WAGE_2026 = 10320
