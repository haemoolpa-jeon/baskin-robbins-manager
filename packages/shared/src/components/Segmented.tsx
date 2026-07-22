import type { ReactNode } from 'react'

export interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
}

/** Equal-width segmented control (maps to shared `.seg`). Use for 2–3 mutually
 *  exclusive views (e.g. 창고/캐비닛1/캐비닛2, schedule/payslip). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
  ariaLabel: string
}) {
  return (
    <div className="seg" role="tablist" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          role="tab"
          aria-selected={value === option.value}
          className={value === option.value ? 'active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
