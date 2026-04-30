import { cn } from '@/lib/utils'

type Props = {
  className?: string
  size?: number
  opacity?: number
}

/** Decorative SARAS spiral, anchored by the parent's `position: relative`. */
export function Watermark({ className, size = 600, opacity = 0.04 }: Props) {
  return (
    <div
      aria-hidden
      className={cn('watermark pointer-events-none select-none', className)}
      style={{ width: size, height: size, opacity }}
    />
  )
}
