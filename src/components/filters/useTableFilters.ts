'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type Serializer<T> = {
  encode: (v: T) => string | undefined         // undefined = omit from URL
  decode: (raw: string | null) => T
  isDefault: (v: T) => boolean
}

/**
 * useTableFilters — a small, framework-friendly state hook for table filters.
 *
 * - Accepts a record of named fields, each with a serializer (URL <-> value).
 * - Reads initial values from `?<key>=...` on first render, falling back to defaults.
 * - Writes back to the URL (replace, no scroll) whenever state changes.
 * - Returns helpers to update one field, clear one, or clear everything.
 *
 * The shape is opaque to the table — the table consumes `state` and applies its
 * own filtering logic. This keeps the hook reusable across pages.
 */
export function useTableFilters<S extends Record<string, any>>(
  serializers: { [K in keyof S]: Serializer<S[K]> },
) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialize from URL on mount, then keep state authoritative
  const [state, setState] = useState<S>(() => {
    const next = {} as S
    for (const key of Object.keys(serializers) as (keyof S)[]) {
      const ser = serializers[key]
      const raw = searchParams.get(key as string)
      next[key] = ser.decode(raw)
    }
    return next
  })

  // Push state changes into the URL (debounced for typing)
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (writeTimer.current) clearTimeout(writeTimer.current)
    writeTimer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      for (const key of Object.keys(serializers) as (keyof S)[]) {
        const ser = serializers[key]
        const value = state[key]
        const encoded = ser.isDefault(value) ? undefined : ser.encode(value)
        if (encoded == null) params.delete(key as string)
        else params.set(key as string, encoded)
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }, 200)
    return () => { if (writeTimer.current) clearTimeout(writeTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const setField = useCallback(<K extends keyof S>(key: K, value: S[K]) => {
    setState(prev => ({ ...prev, [key]: value }))
  }, [])

  const clearField = useCallback(<K extends keyof S>(key: K) => {
    setState(prev => {
      const ser = serializers[key]
      // Use the default by decoding null
      return { ...prev, [key]: ser.decode(null) }
    })
  }, [serializers])

  const clearAll = useCallback(() => {
    const next = {} as S
    for (const key of Object.keys(serializers) as (keyof S)[]) {
      next[key] = serializers[key].decode(null)
    }
    setState(next)
  }, [serializers])

  const replaceAll = useCallback((patch: Partial<S>) => {
    setState(prev => ({ ...prev, ...patch }))
  }, [])

  const activeCount = useMemo(() => {
    let n = 0
    for (const key of Object.keys(serializers) as (keyof S)[]) {
      if (!serializers[key].isDefault(state[key])) n++
    }
    return n
  }, [state, serializers])

  return { state, setField, clearField, clearAll, replaceAll, activeCount }
}

// =============================================================
// Reusable serializer builders
// =============================================================

export const stringSerializer = (def = ''): Serializer<string> => ({
  encode: v => v || undefined,
  decode: raw => raw ?? def,
  isDefault: v => !v,
})

export const stringArraySerializer = (): Serializer<string[]> => ({
  encode: v => v.length ? v.join(',') : undefined,
  decode: raw => raw ? raw.split(',').filter(Boolean) : [],
  isDefault: v => v.length === 0,
})

export const stockSerializer = (): Serializer<import('./types').StockFilter> => ({
  encode: v => {
    if (v.mode === 'any') return undefined
    if (v.mode === 'range') {
      const parts = []
      if (v.min != null) parts.push(`min:${v.min}`)
      if (v.max != null) parts.push(`max:${v.max}`)
      if (parts.length === 0) return undefined
      return `range,${parts.join(',')}`
    }
    return v.mode
  },
  decode: raw => {
    if (!raw) return { mode: 'any' }
    if (raw === 'out' || raw === 'low' || raw === 'in') return { mode: raw }
    if (raw.startsWith('range')) {
      const out: any = { mode: 'range' }
      const parts = raw.split(',').slice(1)
      for (const p of parts) {
        const [k, v] = p.split(':')
        if (k === 'min') out.min = Number(v)
        if (k === 'max') out.max = Number(v)
      }
      return out
    }
    return { mode: 'any' }
  },
  isDefault: v => v.mode === 'any',
})

export const presenceSerializer = (): Serializer<import('./types').PresenceFilter> => ({
  encode: v => {
    if (v.mode === 'any') return undefined
    if (v.mode === 'range') {
      const parts: string[] = []
      if (v.min != null) parts.push(`min:${v.min}`)
      if (v.max != null) parts.push(`max:${v.max}`)
      if (parts.length === 0) return undefined
      return `range,${parts.join(',')}`
    }
    return v.mode
  },
  decode: raw => {
    if (!raw) return { mode: 'any' }
    if (raw === 'set' || raw === 'missing') return { mode: raw }
    if (raw.startsWith('range')) {
      const out: any = { mode: 'range' }
      for (const p of raw.split(',').slice(1)) {
        const [k, v] = p.split(':')
        if (k === 'min') out.min = Number(v)
        if (k === 'max') out.max = Number(v)
      }
      return out
    }
    return { mode: 'any' }
  },
  isDefault: v => v.mode === 'any',
})

export const dateRangeSerializer = (): Serializer<import('./types').DateRangeFilter> => ({
  encode: v => {
    if (!v.from && !v.to) return undefined
    return [v.from ?? '', v.to ?? ''].join('..')
  },
  decode: raw => {
    if (!raw) return {}
    const [from, to] = raw.split('..')
    return { from: from || undefined, to: to || undefined }
  },
  isDefault: v => !v.from && !v.to,
})
