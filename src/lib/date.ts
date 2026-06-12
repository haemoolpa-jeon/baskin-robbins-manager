// Calendar helpers — Korean weekdays, month iteration, Mon–Sun week grouping.
// All dates are handled in local time and serialized as 'YYYY-MM-DD'.

export const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'] // index = Date.getDay()

/** 'YYYY-MM-DD' for a local Date (no timezone shift). */
export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Parse 'YYYY-MM-DD' as a local Date. */
export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function currentYearMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function ymParts(ym: string): { year: number; month: number } {
  const [year, month] = ym.split('-').map(Number)
  return { year, month }
}

/** '2026-06' -> '2026년 6월' */
export function ymLabel(ym: string): string {
  const { year, month } = ymParts(ym)
  return `${year}년 ${month}월`
}

/** Shift a 'YYYY-MM' by delta months. */
export function addMonths(ym: string, delta: number): string {
  const { year, month } = ymParts(ym)
  const d = new Date(year, month - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Every day in the given 'YYYY-MM'. */
export function monthDays(ym: string): Date[] {
  const { year, month } = ymParts(ym)
  const days: Date[] = []
  const d = new Date(year, month - 1, 1)
  while (d.getMonth() === month - 1) {
    days.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}

/** Monday-of-week (Mon–Sun) for a date, as 'YYYY-MM-DD'. Used to group hours
 *  into weeks for the 주휴수당 calculation. */
export function weekStartIso(d: Date): string {
  const day = d.getDay() // 0=Sun..6=Sat
  const offsetToMonday = (day + 6) % 7
  const mon = new Date(d)
  mon.setDate(d.getDate() - offsetToMonday)
  return isoDate(mon)
}

/**
 * Lay out a month as calendar weeks (Mon–Sun rows). Each row has 7 cells; cells
 * outside the month are null. Matches how the spreadsheet shows the month.
 */
export function monthWeeks(ym: string): (Date | null)[][] {
  const days = monthDays(ym)
  const weeks: (Date | null)[][] = []
  let week: (Date | null)[] = []
  // Pad the first week so day 1 lands under its weekday (Mon-first columns).
  const firstDow = (days[0].getDay() + 6) % 7 // 0=Mon
  for (let i = 0; i < firstDow; i++) week.push(null)
  for (const d of days) {
    week.push(d)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

/** Mon-first weekday headers. */
export const WEEKDAYS_MON_FIRST = ['월', '화', '수', '목', '금', '토', '일']
