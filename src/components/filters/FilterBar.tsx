'use client'

import * as React from 'react'
import { Filter, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

/**
 * FilterBar — composition root for the table filter UI.
 *
 *   <FilterBar>
 *     <FilterBar.Search ... />
 *     <FilterBar.Presets>{...}</FilterBar.Presets>
 *     <FilterBar.OpenButton onClick={...} count={3} />
 *     <FilterBar.Actions>{...}</FilterBar.Actions>
 *     <FilterBar.Chips>{...}</FilterBar.Chips>
 *   </FilterBar>
 *
 * Each subcomponent is just a styled wrapper. The host page assembles them
 * in whatever order makes sense for its toolbar.
 */
export function FilterBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {children}
    </div>
  )
}

FilterBar.Toolbar = function Toolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {children}
    </div>
  )
}

FilterBar.Search = function FilterSearch({
  value, onChange, placeholder = 'Search…', className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('relative min-w-[220px] flex-1 max-w-md', className)}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  )
}

FilterBar.OpenButton = function FilterOpenButton({
  onClick, count = 0,
}: { onClick: () => void; count?: number }) {
  return (
    <Button onClick={onClick} variant="secondary" size="md">
      <Filter size={14} />
      <span>Filters</span>
      {count > 0 && (
        <span className="ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-100 px-1.5 text-[11.5px] font-semibold text-brand-700">
          {count}
        </span>
      )}
    </Button>
  )
}

FilterBar.Presets = function FilterPresets({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-1.5">{children}</div>
}

FilterBar.Preset = function PresetChip({
  active, onClick, children,
}: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[12.5px] font-medium transition-all',
        active
          ? 'border-brand-300 bg-brand-100 text-brand-800'
          : 'border-hairline bg-white/70 text-ink-600 hover:border-brand-200 hover:bg-brand-50/40 hover:text-brand-700',
      )}
    >
      {children}
    </button>
  )
}

FilterBar.Actions = function FilterActions({ children }: { children: React.ReactNode }) {
  return <div className="ml-auto flex items-center gap-2">{children}</div>
}

FilterBar.Chips = function FilterChips({
  children, count, onClearAll,
}: {
  children: React.ReactNode
  count: number
  onClearAll: () => void
}) {
  if (count === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11.5px] font-medium uppercase tracking-[0.12em] text-ink-400">
        Active:
      </span>
      {children}
      <button
        onClick={onClearAll}
        className="ml-1 rounded-md px-2 py-0.5 text-[12px] font-medium text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
      >
        Clear all
      </button>
    </div>
  )
}

FilterBar.Stats = function FilterStats({ children }: { children: React.ReactNode }) {
  return <span className="text-[12.5px] text-ink-500">{children}</span>
}
