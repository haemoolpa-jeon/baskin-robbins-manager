import { describe, expect, it } from 'vitest'
import { computePayroll, holidayHoursForWeek } from './payroll'
import type { Shift } from './types'

// Helper: a shift of `hours` on a given date, starting 09:00.
let n = 0
function shift(workDate: string, hours: number): Shift {
  return { id: `s${n++}`, workerId: 1, workDate, startMin: 540, endMin: 540 + hours * 60 }
}

describe('holidayHoursForWeek (주휴시간)', () => {
  it('is 0 below 15h/week', () => {
    expect(holidayHoursForWeek(14)).toBe(0)
    expect(holidayHoursForWeek(0)).toBe(0)
  })
  it('prorates between 15h and 40h: 20h → 4h', () => {
    expect(holidayHoursForWeek(20)).toBeCloseTo(4)
  })
  it('caps at 8h for long weeks: 45h → 8h', () => {
    expect(holidayHoursForWeek(45)).toBe(8)
    expect(holidayHoursForWeek(40)).toBe(8)
  })
})

describe('computePayroll', () => {
  // Week of 2026-06-01 (Mon) … 06-07 (Sun). 4 × 5h = 20h in one week.
  const week20 = [
    shift('2026-06-01', 5),
    shift('2026-06-02', 5),
    shift('2026-06-03', 5),
    shift('2026-06-04', 5),
  ]

  it('computes a single 20h week with 주휴 and no tax', () => {
    const p = computePayroll(week20, 10000, false)
    expect(p.totalHours).toBe(20)
    expect(p.holidayHours).toBeCloseTo(4)
    expect(p.basePay).toBe(200000) // 20 × 10000
    expect(p.holidayPay).toBe(40000) // 4 × 10000
    expect(p.gross).toBe(240000)
    expect(p.deduction).toBe(0)
    expect(p.net).toBe(240000)
  })

  it('applies 3.3% withholding', () => {
    const p = computePayroll(week20, 10000, true)
    expect(p.deduction).toBe(7920) // round(240000 × 0.033)
    expect(p.net).toBe(232080)
  })

  it('adds 초과/기타 to gross before tax', () => {
    const p = computePayroll(week20, 10000, true, 50000)
    expect(p.gross).toBe(290000)
    expect(p.deduction).toBe(9570) // round(290000 × 0.033)
    expect(p.net).toBe(280430)
  })

  it('sums 주휴 per week, not on the monthly total', () => {
    // Week 1 (06-01..07): 20h → 4h holiday. Week 2 (06-08..14): 10h → 0h holiday.
    const shifts = [...week20, shift('2026-06-08', 5), shift('2026-06-09', 5)]
    const p = computePayroll(shifts, 10000, false)
    expect(p.totalHours).toBe(30)
    expect(p.holidayHours).toBeCloseTo(4) // NOT holidayHoursForWeek(30)=6
    expect(p.weeks).toHaveLength(2)
  })

  it('caps each week at 8h holiday', () => {
    // 5 × 9h = 45h in one week → holiday capped at 8h.
    const shifts = [
      shift('2026-06-01', 9),
      shift('2026-06-02', 9),
      shift('2026-06-03', 9),
      shift('2026-06-04', 9),
      shift('2026-06-05', 9),
    ]
    const p = computePayroll(shifts, 10000, false)
    expect(p.totalHours).toBe(45)
    expect(p.holidayHours).toBe(8)
  })
})
