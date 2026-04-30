'use client'

import * as React from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'step'> & {
  value: string
  onChange: (next: string) => void
  /** Increment per click. Defaults to 0.25 (typical for SPH/CYL/ADD). */
  step?: number
  /** Decimal precision when stepping. Defaults to 2. Use 0 for integers (axis). */
  precision?: number
  /** Min/max clamps applied when stepping (and via input attrs). */
  min?: number
  max?: number
  /** Optional sign-aware formatter (e.g. show "+0.50"). */
  signed?: boolean
  className?: string
}

/**
 * Compact number input with vertical ▲▼ stepper buttons.
 *
 * Designed for fast Rx entry — clinicians can step by 0.25 without using the
 * keyboard. Mouse wheel and arrow keys still work via the underlying input.
 */
export function NumberStepper({
  value, onChange, step = 0.25, precision = 2,
  min, max, signed = false, className, placeholder, ...rest
}: Props) {
  const format = (n: number) => {
    const fixed = n.toFixed(precision)
    if (signed && n > 0) return `+${fixed}`
    return fixed
  }

  const apply = (delta: number) => {
    const current = value === '' ? 0 : parseFloat(value)
    if (isNaN(current)) return
    let next = current + delta * step
    if (min != null) next = Math.max(min, next)
    if (max != null) next = Math.min(max, next)
    // Snap to step grid to avoid 0.249999 floating-point noise
    next = Math.round(next / step) * step
    onChange(format(next))
  }

  return (
    <div
      className={cn(
        'group flex h-9 items-stretch rounded-md border border-hairline bg-white text-[13px] tabular',
        'focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/25',
        className,
      )}
    >
      <input
        // type="text" so signed values like "+0.50" render verbatim. We still
        // restrict input to a decimal pattern below and surface the numeric
        // keypad on mobile via inputMode.
        type="text"
        inputMode="decimal"
        pattern="^[+-]?\\d*(\\.\\d+)?$"
        value={value}
        onChange={e => {
          const v = e.target.value
          // Accept anything that's an empty string, a sign, or matches the
          // pattern. Reject random text so users can't type letters.
          if (v === '' || v === '+' || v === '-' || /^[+-]?\d*(\.\d+)?$/.test(v)) {
            onChange(v)
          }
        }}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-l-md bg-transparent px-2 py-1 text-center outline-none focus:outline-none"
        {...rest}
      />
      <div className="flex flex-col border-l border-hairline">
        <button
          type="button"
          onClick={() => apply(+1)}
          tabIndex={-1}
          aria-label={`Increase by ${step}`}
          className="flex h-1/2 w-6 items-center justify-center text-ink-500 transition-colors hover:bg-brand-50 hover:text-brand-700 active:bg-brand-100"
        >
          <ChevronUp size={12} strokeWidth={2.25} />
        </button>
        <button
          type="button"
          onClick={() => apply(-1)}
          tabIndex={-1}
          aria-label={`Decrease by ${step}`}
          className="flex h-1/2 w-6 items-center justify-center border-t border-hairline text-ink-500 transition-colors hover:bg-brand-50 hover:text-brand-700 active:bg-brand-100"
        >
          <ChevronDown size={12} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  )
}
