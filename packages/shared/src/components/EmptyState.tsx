import type { ReactNode } from 'react'

/** Standard "nothing here" panel. One place for every empty list/grid so the
 *  app never shows a blank area or a developer-facing message to the owner. */
export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      {icon && <span className="empty-state-icon">{icon}</span>}
      <strong className="empty-state-title">{title}</strong>
      {hint && <span className="empty-state-hint">{hint}</span>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  )
}
