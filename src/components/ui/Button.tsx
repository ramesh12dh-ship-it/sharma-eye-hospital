import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-all duration-[var(--duration-fast)] ease-[var(--ease-out-soft)] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-1 active:scale-[0.99]',
  {
    variants: {
      variant: {
        primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:shadow-md',
        secondary: 'border border-hairline bg-white/70 text-ink-800 hover:bg-white hover:border-ink-300',
        ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
        outline: 'border border-brand-200 bg-brand-50/60 text-brand-700 hover:bg-brand-100',
        danger: 'border border-coral-200 bg-coral-50 text-coral-700 hover:bg-coral-100',
        link: 'text-brand-600 underline-offset-4 hover:underline px-0 py-0 h-auto',
      },
      size: {
        sm: 'h-8 px-3 text-[13px]',
        md: 'h-9 px-3.5 text-[14px]',
        lg: 'h-10 px-4 text-[14.5px]',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { buttonVariants }
