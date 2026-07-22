// Korean part-time payroll — replicates 2026_Premium_PartTime_Manager.xlsx.
//
// Per worker, per month:
//   총시간   = Σ shift hours
//   주휴시간 = Σ over Mon–Sun weeks: weekHours ≥ 15 ? min(weekHours/40×8, 8) : 0
//   기본급   = 총시간 × 시급
//   주휴수당 = 주휴시간 × 시급
//   세전급여 = 기본급 + 주휴수당 + 초과/기타
//   공제액   = 세금 적용 시 세전 × 3.3%
//   실수령액 = 세전 − 공제
import type { Shift } from './types'
import { parseDate, weekStartIso } from './date'
import { hoursBetween } from './time'

const WEEKLY_HOLIDAY_THRESHOLD = 15 // 주 15시간 이상 → 주휴 발생
const FULL_WEEK_HOURS = 40
const HOLIDAY_BASE_HOURS = 8 // 만근 주휴 = 8시간, 시간 비례
const HOLIDAY_CAP = 8
export const TAX_RATE = 0.033 // 사업소득세 3.3%

export interface WeekHours {
  weekStart: string // Monday, 'YYYY-MM-DD'
  hours: number
  holidayHours: number
}

export interface WorkerPayroll {
  totalHours: number
  holidayHours: number
  basePay: number // 기본급(A)
  holidayPay: number // 주휴수당(B)
  extra: number // 초과/기타(C)
  gross: number // 세전급여
  deduction: number // 공제액(3.3%)
  net: number // 실수령액
  weeks: WeekHours[]
}

/** 주휴시간 for a single week's total hours. */
export function holidayHoursForWeek(weekHours: number): number {
  if (weekHours < WEEKLY_HOLIDAY_THRESHOLD) return 0
  return Math.min((weekHours / FULL_WEEK_HOURS) * HOLIDAY_BASE_HOURS, HOLIDAY_CAP)
}

export function computePayroll(
  shifts: Shift[],
  wage: number,
  taxWithholding: boolean,
  extra = 0,
): WorkerPayroll {
  const byWeek = new Map<string, number>()
  let totalHours = 0
  for (const s of shifts) {
    const h = hoursBetween(s.startMin, s.endMin)
    totalHours += h
    const wk = weekStartIso(parseDate(s.workDate))
    byWeek.set(wk, (byWeek.get(wk) ?? 0) + h)
  }

  const weeks: WeekHours[] = [...byWeek.entries()]
    .map(([weekStart, hours]) => ({ weekStart, hours, holidayHours: holidayHoursForWeek(hours) }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))

  const holidayHours = weeks.reduce((a, w) => a + w.holidayHours, 0)
  const basePay = Math.round(totalHours * wage)
  const holidayPay = Math.round(holidayHours * wage)
  const gross = basePay + holidayPay + extra
  const deduction = taxWithholding ? Math.round(gross * TAX_RATE) : 0
  const net = gross - deduction

  return { totalHours, holidayHours, basePay, holidayPay, extra, gross, deduction, net, weeks }
}
