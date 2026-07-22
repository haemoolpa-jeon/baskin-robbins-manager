import type { ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'danger' | 'warn' | 'ok' | 'pink' | 'blue'

/** Small pill for counts/statuses (low-stock counts, category chips, etc.). */
export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}
