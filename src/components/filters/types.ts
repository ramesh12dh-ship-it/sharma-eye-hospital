/**
 * Shared filter primitives. Designed to serialize cleanly to URL params
 * and (later) to a Supabase query when client-side filtering becomes too slow.
 */

export type StockFilter =
  | { mode: 'any' }
  | { mode: 'out' }                                     // stock === 0
  | { mode: 'low' }                                     // 1..=2
  | { mode: 'in' }                                      // > 0
  | { mode: 'range'; min?: number; max?: number }

export type PresenceFilter =
  | { mode: 'any' }
  | { mode: 'set' }
  | { mode: 'missing' }
  | { mode: 'range'; min?: number; max?: number }

export type DateRangeFilter = { from?: string; to?: string }
