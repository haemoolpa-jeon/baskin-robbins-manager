import { isoDate, monthWeeks, WEEKDAYS_MON_FIRST } from '@shared/lib/date'
import { minutesToShort } from '@/lib/time'
import type { Shift } from '@/lib/types'

interface Props {
  ym: string
  shiftsByDate: Map<string, Shift[]>
  onDayTap: (dateIso: string) => void
}

export function ScheduleCalendar({ ym, shiftsByDate, onDayTap }: Props) {
  const weeks = monthWeeks(ym)

  return (
    <div className="cal">
      <div className="cal-head">
        {WEEKDAYS_MON_FIRST.map((d, i) => (
          <div key={d} className={i === 5 ? 'sat' : i === 6 ? 'sun' : ''}>
            {d}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div className="cal-week" key={wi}>
          {week.map((d, di) => {
            if (!d) return <div className="cal-cell empty" key={di} />
            const iso = isoDate(d)
            const shifts = shiftsByDate.get(iso) ?? []
            const dow = d.getDay()
            return (
              <button
                key={di}
                className={`cal-cell ${shifts.length ? 'has-shift' : ''}`}
                onClick={() => onDayTap(iso)}
              >
                <span className={`cal-date ${dow === 6 ? 'sat' : dow === 0 ? 'sun' : ''}`}>{d.getDate()}</span>
                {shifts.slice(0, 2).map((s) => (
                  <span className="cal-shift" key={s.id}>
                    {minutesToShort(s.startMin)}–{minutesToShort(s.endMin)}
                  </span>
                ))}
                {shifts.length > 2 && <span className="cal-shift">+{shifts.length - 2}</span>}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
