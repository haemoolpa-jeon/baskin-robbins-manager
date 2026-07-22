/**
 * Single quantity stepper: − [n] +. Replaces the per-feature stepper variants
 * (round qty-control, mini-stepper, count-stepper, par-stepper) with one
 * component so clamping, sizing, and touch targets live in one place.
 */
interface StepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  size?: 'sm' | 'md' | 'lg'
  ariaLabel: string
  disabled?: boolean
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  size = 'md',
  ariaLabel,
  disabled = false,
}: StepperProps) {
  const clamp = (n: number) => {
    const floored = Math.floor(Number.isFinite(n) ? n : min)
    return Math.max(min, Math.min(max, floored))
  }
  const set = (n: number) => onChange(clamp(n))

  return (
    <div className={`stepper stepper-${size}`}>
      <button
        type="button"
        className="stepper-btn stepper-minus"
        onClick={() => set(value - step)}
        disabled={disabled || value <= min}
        aria-label={`${ariaLabel} 빼기`}
      >
        −
      </button>
      <input
        className="stepper-input"
        type="number"
        inputMode="numeric"
        min={min}
        value={value}
        disabled={disabled}
        onChange={(event) => set(Number(event.target.value))}
        aria-label={ariaLabel}
      />
      <button
        type="button"
        className="stepper-btn stepper-plus"
        onClick={() => set(value + step)}
        disabled={disabled || value >= max}
        aria-label={`${ariaLabel} 더하기`}
      >
        +
      </button>
    </div>
  )
}
