'use client'

import { useMemo, useState } from 'react'
import { Check, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input, Label } from '@/components/ui/Input'
import type { PresenceFilter, StockFilter, DateRangeFilter } from './types'

// ─── MultiSelect (with search-in-picker for big lists) ─────────────────
export function MultiSelectPicker({
  label, options, value, onChange, placeholder = 'Search…', optionLabels,
}: {
  label: string
  options: string[]
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  /** Optional value→label map for human-readable display. */
  optionLabels?: Record<string, string>
}) {
  const [query, setQuery] = useState('')
  const labelOf = (v: string) => optionLabels?.[v] ?? v

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    const list = q
      ? options.filter(o => labelOf(o).toLowerCase().includes(q) || o.toLowerCase().includes(q))
      : options
    return list.slice(0, 200)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, query, optionLabels])

  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt])
  }

  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className="h-9 pl-8 text-[13px]"
        />
      </div>
      <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-hairline bg-white/70">
        {filtered.length === 0 && (
          <div className="px-3 py-3 text-[12.5px] text-ink-400">No matches.</div>
        )}
        {filtered.map(opt => {
          const checked = value.includes(opt)
          return (
            <button
              type="button"
              key={opt}
              onClick={() => toggle(opt)}
              className={cn(
                'flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-[13px] transition-colors',
                checked ? 'bg-brand-50/80 text-brand-800' : 'text-ink-700 hover:bg-ink-50',
              )}
            >
              <span className="truncate">{labelOf(opt)}</span>
              {checked && <Check size={13} className="shrink-0 text-brand-600" />}
            </button>
          )
        })}
      </div>
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="mt-2 text-[12px] font-medium text-ink-500 hover:text-ink-800"
        >
          Clear ({value.length})
        </button>
      )}
    </div>
  )
}

// ─── Stock filter ──────────────────────────────────────────────────────
export function StockPicker({
  value, onChange,
}: { value: StockFilter; onChange: (next: StockFilter) => void }) {
  const isMode = (m: StockFilter['mode']) => value.mode === m
  return (
    <div>
      <Label className="mb-2 block">Stock</Label>
      <div className="flex flex-wrap gap-1.5">
        <ModeButton active={isMode('any')} onClick={() => onChange({ mode: 'any' })}>Any</ModeButton>
        <ModeButton active={isMode('low')} onClick={() => onChange({ mode: 'low' })}>Low (1–2)</ModeButton>
        <ModeButton active={isMode('in')} onClick={() => onChange({ mode: 'in' })}>In stock</ModeButton>
        <ModeButton active={isMode('out')} onClick={() => onChange({ mode: 'out' })}>0 in stock</ModeButton>
        <ModeButton active={isMode('range')} onClick={() => onChange({ mode: 'range' })}>Range…</ModeButton>
      </div>
      {value.mode === 'range' && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Input
            type="number" placeholder="Min"
            value={value.min ?? ''}
            onChange={e => onChange({ ...value, min: e.target.value ? Number(e.target.value) : undefined })}
            className="h-9 text-[13px]"
          />
          <Input
            type="number" placeholder="Max"
            value={value.max ?? ''}
            onChange={e => onChange({ ...value, max: e.target.value ? Number(e.target.value) : undefined })}
            className="h-9 text-[13px]"
          />
        </div>
      )}
    </div>
  )
}

// ─── Presence filter (set / missing / range) ───────────────────────────
export function PresencePicker({
  label, value, onChange,
}: { label: string; value: PresenceFilter; onChange: (next: PresenceFilter) => void }) {
  const isMode = (m: PresenceFilter['mode']) => value.mode === m
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        <ModeButton active={isMode('any')} onClick={() => onChange({ mode: 'any' })}>Any</ModeButton>
        <ModeButton active={isMode('set')} onClick={() => onChange({ mode: 'set' })}>Is set</ModeButton>
        <ModeButton active={isMode('missing')} onClick={() => onChange({ mode: 'missing' })}>Missing</ModeButton>
        <ModeButton active={isMode('range')} onClick={() => onChange({ mode: 'range' })}>Between…</ModeButton>
      </div>
      {value.mode === 'range' && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Input
            type="number" placeholder="Min"
            value={value.min ?? ''}
            onChange={e => onChange({ ...value, min: e.target.value ? Number(e.target.value) : undefined })}
            className="h-9 text-[13px]"
          />
          <Input
            type="number" placeholder="Max"
            value={value.max ?? ''}
            onChange={e => onChange({ ...value, max: e.target.value ? Number(e.target.value) : undefined })}
            className="h-9 text-[13px]"
          />
        </div>
      )}
    </div>
  )
}

// ─── Date range ────────────────────────────────────────────────────────
export function DateRangePicker({
  label, value, onChange,
}: { label: string; value: DateRangeFilter; onChange: (next: DateRangeFilter) => void }) {
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="date" value={value.from ?? ''}
          onChange={e => onChange({ ...value, from: e.target.value || undefined })}
          className="h-9 text-[13px]"
        />
        <Input
          type="date" value={value.to ?? ''}
          onChange={e => onChange({ ...value, to: e.target.value || undefined })}
          className="h-9 text-[13px]"
        />
      </div>
    </div>
  )
}

// ─── Internal: small mode toggle button ────────────────────────────────
function ModeButton({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md border px-2.5 py-1 text-[12.5px] font-medium transition-colors',
        active
          ? 'border-brand-300 bg-brand-100 text-brand-800'
          : 'border-hairline bg-white/70 text-ink-700 hover:bg-ink-50',
      )}
    >
      {children}
    </button>
  )
}
