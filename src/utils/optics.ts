/**
 * Format a single eye's Rx into a compact human-readable string.
 * Returns null if both sphere and cylinder are absent.
 */
export function eyeStr(
  sph: number | null,
  cyl: number | null,
  axis: number | null,
  add: number | null,
): string | null {
  if (sph == null && cyl == null) return null
  const s = sph != null ? (sph >= 0 ? `+${sph.toFixed(2)}` : sph.toFixed(2)) : '—'
  const c = cyl != null ? (cyl >= 0 ? `+${cyl.toFixed(2)}` : cyl.toFixed(2)) : '—'
  const a = axis != null ? ` × ${axis}°` : ''
  const ad = add != null ? `  ADD ${add >= 0 ? '+' : ''}${add.toFixed(2)}` : ''
  return `${s} / ${c}${a}${ad}`
}

export type RxSnapshot = {
  r_sph: number | null
  r_cyl: number | null
  r_axis: number | null
  r_add: number | null
  l_sph: number | null
  l_cyl: number | null
  l_axis: number | null
  l_add: number | null
  pd: number | null
}

export function hasAnyRx(rx: Partial<RxSnapshot>): boolean {
  return (
    rx.r_sph != null || rx.r_cyl != null ||
    rx.l_sph != null || rx.l_cyl != null ||
    rx.pd != null
  )
}
