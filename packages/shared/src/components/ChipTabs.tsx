import type { ReactNode } from 'react'

export interface ChipOption<T extends string> {
  value: T
  label: ReactNode
  /** Optional trailing count (e.g. shortage count on a filter pill). */
  count?: number
  /** Visual tone when active — 'shortage' turns the active pill amber. */
  tone?: 'default' | 'shortage'
}

/** Horizontal, wrapping/scrolling pill row (maps to shared `.chip-tabs`).
 *  Replaces the per-feature filter/subtype/type pill styles. */
export function ChipTabs<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  scroll = false,
}: {
  value: T
  options: ChipOption<T>[]
  onChange: (value: T) => void
  ariaLabel: string
  /** Horizontal-scroll instead of wrap (for long subtype rows). */
  scroll?: boolean
}) {
  return (
    <div className={`chip-tabs ${scroll ? 'chip-tabs-scroll' : ''}`} role="tablist" aria-label={ariaLabel}>
      {options.map((option) => {
        const active = value === option.value
        const tone = option.tone === 'shortage' ? 'shortage' : ''
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            className={`chip-tab ${tone} ${active ? 'active' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
            {option.count != null && option.count > 0 && <span className="chip-tab-count">{option.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
