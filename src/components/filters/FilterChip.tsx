'use client'

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  label: string
  value: string
  onRemove?: () => void
  onClick?: () => void
  className?: string
}

export function FilterChip({ label, value, onRemove, onClick, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center overflow-hidden rounded-full border border-brand-200 bg-brand-50/70 text-[12.5px] tabular',
        className,
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1.5 px-3 py-1 transition-colors hover:bg-brand-100/70"
      >
        <span className="font-semibold text-brand-700">{label}</span>
        <span className="text-brand-700/80">{value}</span>
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label} filter`}
          className="border-l border-brand-200 px-1.5 py-1 text-brand-500 transition-colors hover:bg-brand-100 hover:text-brand-800"
        >
          <X size={12} />
        </button>
      )}
    </span>
  )
}
