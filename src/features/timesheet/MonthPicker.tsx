import { addMonths, ymLabel } from '@/lib/date'

export function MonthPicker({ ym, onChange }: { ym: string; onChange: (ym: string) => void }) {
  return (
    <div className="month-picker">
      <button onClick={() => onChange(addMonths(ym, -1))} aria-label="이전 달">
        ◀
      </button>
      <div className="month-label">{ymLabel(ym)}</div>
      <button onClick={() => onChange(addMonths(ym, 1))} aria-label="다음 달">
        ▶
      </button>
    </div>
  )
}
