import type { BadgeTone } from '@shared/components/Badge'

/**
 * One source of truth for stock status across storage, products, and order prep.
 * (Cabinet tub fill-level % is a separate axis — see levelStatus below.)
 */
export type StockLevel = 'empty' | 'low' | 'ok'

export function stockStatus(quantity: number, par: number): StockLevel {
  if (quantity <= 0) return 'empty'
  if (quantity < par) return 'low'
  return 'ok'
}

export const STOCK_LABEL: Record<StockLevel, string> = {
  empty: '품절',
  low: '부족',
  ok: '충분',
}

export const STOCK_TONE: Record<StockLevel, BadgeTone> = {
  empty: 'danger',
  low: 'warn',
  ok: 'ok',
}

/** Cabinet tub remaining-% status (display fill level, not stock count). */
export type TubLevel = 'critical' | 'low' | 'full'

export function levelStatus(level: number): TubLevel {
  if (level <= 20) return 'critical'
  if (level <= 50) return 'low'
  return 'full'
}
