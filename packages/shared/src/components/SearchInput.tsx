import { Search } from 'lucide-react'

/** Unified search box: a lucide search icon + text input in a focus-ring shell.
 *  Replaces the ad-hoc .storage-search / .count-search / emoji .assign-search. */
export function SearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel: string
}) {
  return (
    <label className="search-input">
      <Search size={20} aria-hidden="true" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
    </label>
  )
}
