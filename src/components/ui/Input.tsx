import * as React from 'react'
import { cn } from '@/lib/utils'

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-hairline bg-white/80 px-3 text-[14px] text-ink-900 placeholder:text-ink-400 transition-shadow',
        'focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/25',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full appearance-none rounded-lg border border-hairline bg-white/80 px-3 pr-9 text-[14px] text-ink-900 transition-shadow',
        'focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/25',
        'disabled:cursor-not-allowed disabled:opacity-60',
        "bg-[url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")] bg-no-repeat",
        className,
      )}
      style={{ backgroundPosition: 'right 10px center' }}
      {...props}
    />
  ),
)
Select.displayName = 'Select'

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-lg border border-hairline bg-white/80 px-3 py-2 text-[14px] text-ink-900 placeholder:text-ink-400 transition-shadow',
        'focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/25',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-[13px] font-medium text-ink-700',
        className,
      )}
      {...props}
    />
  ),
)
Label.displayName = 'Label'
