// Time helpers. Shift times are minutes from midnight (09:00 = 540).

/** Store operating hours, used by the time picker. */
export const OPEN_MIN = 9 * 60 // 09:00
export const CLOSE_MIN = 22 * 60 // 22:00
export const STEP_MIN = 30

/** 540 -> "9:00", 570 -> "9:30" */
export function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

/** Compact form for tight cells: 540 -> "9", 570 -> "9:30" (drops ":00"). */
export function minutesToShort(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h}` : `${h}:${String(m).padStart(2, '0')}`
}

/** Hours (decimal) between two minute marks. */
export function hoursBetween(startMin: number, endMin: number): number {
  return (endMin - startMin) / 60
}

/** 6 -> "6시간", 6.5 -> "6.5시간" */
export function formatHours(h: number): string {
  const rounded = Math.round(h * 10) / 10
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}시간`
}

/** All selectable time marks for the picker (09:00 … 22:00 in 30-min steps). */
export function timeMarks(): number[] {
  const marks: number[] = []
  for (let m = OPEN_MIN; m <= CLOSE_MIN; m += STEP_MIN) marks.push(m)
  return marks
}
