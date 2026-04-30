import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium tracking-tight whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'border-ink-200 bg-ink-50 text-ink-700',
        brand:   'border-brand-200 bg-brand-50 text-brand-700',
        success: 'border-accent-200 bg-accent-50 text-accent-700',
        warn:    'border-amber-200 bg-amber-50 text-amber-700',
        danger:  'border-coral-200 bg-coral-50 text-coral-700',
        muted:   'border-ink-200 bg-white text-ink-500',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

type Props = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>

export function Badge({ className, tone, ...props }: Props) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}

/** Helper: maps an optical-order status to a tone + label. */
export function OrderStatusBadge({ status }: { status: 'ordered' | 'in_workshop' | 'ready' | 'delivered' | 'cancelled' }) {
  const map = {
    ordered:     { tone: 'warn', label: 'Ordered' },
    in_workshop: { tone: 'brand', label: 'In workshop' },
    ready:       { tone: 'success', label: 'Ready' },
    delivered:   { tone: 'muted', label: 'Delivered' },
    cancelled:   { tone: 'danger', label: 'Cancelled' },
  } as const
  const { tone, label } = map[status]
  return <Badge tone={tone}>{label}</Badge>
}
