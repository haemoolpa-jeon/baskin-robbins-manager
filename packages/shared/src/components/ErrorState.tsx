import { AlertCircle } from 'lucide-react'

/** Friendly, owner-facing error panel (never leaks technical/dev language).
 *  Optional retry button for recoverable failures (e.g. network). */
export function ErrorState({
  title = '잠시 문제가 생겼어요',
  hint = '인터넷 연결을 확인한 뒤 다시 시도해 주세요.',
  onRetry,
}: {
  title?: string
  hint?: string
  onRetry?: () => void
}) {
  return (
    <div className="error-state">
      <span className="error-state-icon" aria-hidden="true">
        <AlertCircle size={32} />
      </span>
      <strong className="error-state-title">{title}</strong>
      {hint && <span className="error-state-hint">{hint}</span>}
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          다시 시도
        </button>
      )}
    </div>
  )
}
