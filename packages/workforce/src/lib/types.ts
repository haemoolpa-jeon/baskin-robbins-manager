// ---------------------------------------------------------------------------
// Workforce domain types (camelCase, app-facing). DB rows are snake_case and
// mapped to these in the data hooks (src/data/*). Keeping one canonical shape
// here is the guardrail that the legacy JS lacked — the shift/payroll bugs were
// shape drift.
// ---------------------------------------------------------------------------

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

/** 2026 최저시급 — default wage for new workers. */
export const MIN_WAGE_2026 = 10320
