import type { ReactNode } from 'react'
import { isoDate, monthWeeks, WEEKDAYS_MON_FIRST } from '@shared/lib/date'

interface CalendarProps {
  /** 'YYYY-MM' month to render. */
  ym: string
  /** Currently-selected day ('YYYY-MM-DD'), highlighted. */
  selectedIso?: string | null
  onDayTap: (iso: string) => void
  /** Emphasize days that have content (e.g. a saved snapshot). */
  isMarked?: (iso: string) => boolean
  /** Optional small content under the date number. */
  renderDay?: (iso: string, date: Date) => ReactNode
  /** Disable (dim, non-tappable) a day — e.g. future dates. */
  isDisabled?: (iso: string) => boolean
}

/** Generic Mon-first month grid with today + selected + marked states. */
export function Calendar({ ym, selectedIso, onDayTap, isMarked, renderDay, isDisabled }: CalendarProps) {
  const weeks = monthWeeks(ym)
  const today = isoDate(new Date())

  return (
    <div className="calendar">
      <div className="calendar-head">
        {WEEKDAYS_MON_FIRST.map((d, i) => (
          <div key={d} className={i === 5 ? 'sat' : i === 6 ? 'sun' : ''}>
            {d}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div className="calendar-week" key={wi}>
          {week.map((d, di) => {
            if (!d) return <div className="calendar-cell empty" key={di} />
            const iso = isoDate(d)
            const dow = d.getDay()
            const disabled = isDisabled?.(iso) ?? false
            const className = [
              'calendar-cell',
              isMarked?.(iso) ? 'marked' : '',
              iso === today ? 'today' : '',
              iso === selectedIso ? 'selected' : '',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <button
                key={di}
                className={className}
                onClick={() => onDayTap(iso)}
                disabled={disabled}
                aria-pressed={iso === selectedIso}
                aria-label={`${d.getMonth() + 1}월 ${d.getDate()}일`}
              >
                <span className={`calendar-date ${dow === 6 ? 'sat' : dow === 0 ? 'sun' : ''}`}>{d.getDate()}</span>
                {renderDay?.(iso, d)}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
