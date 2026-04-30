'use client'

import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export const TableShell = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'overflow-hidden rounded-xl border border-hairline bg-white/85 shadow-[var(--shadow-soft)]',
      className,
    )}
    {...props}
  />
)

/**
 * Horizontal scroll container for tables. Renders a soft white-fade overlay
 * on the right (and on the left when scrolled past the start) so mouse users
 * see that there's more content beyond the visible area. Without this hint,
 * horizontal scroll on a desktop table is invisible and users miss columns.
 */
export const TableScroll = ({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) => {
  const ref = useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      setShowLeft(el.scrollLeft > 2)
      setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

  return (
    <div className="relative">
      <div ref={ref} className={cn('overflow-x-auto', className)}>
        {children}
      </div>
      {showLeft && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white via-white/85 to-transparent"
        />
      )}
      {showRight && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white via-white/85 to-transparent"
        />
      )}
    </div>
  )
}

type TableProps = React.TableHTMLAttributes<HTMLTableElement> & {
  /** Minimum width before horizontal scroll kicks in. Use for dense tables. */
  minWidth?: number | string
}

export const Table = ({ className, minWidth, style, ...props }: TableProps) => (
  <table
    className={cn(
      'w-full border-collapse text-left tabular text-[14px]',
      className,
    )}
    style={minWidth != null ? { minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth, ...style } : style}
    {...props}
  />
)

export const Thead = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn('bg-ink-50/70', className)} {...props} />
)

export const Th = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(
      'px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-500 border-b border-hairline whitespace-nowrap',
      className,
    )}
    {...props}
  />
)

export const Tr = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={cn(
      'border-b border-hairline last:border-0 transition-colors hover:bg-brand-50/40',
      className,
    )}
    {...props}
  />
)

export const Td = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td
    className={cn(
      'px-4 py-3.5 text-ink-800 align-middle whitespace-nowrap',
      className,
    )}
    {...props}
  />
)

export const TableEmpty = ({ message = 'No results.', colSpan }: { message?: string; colSpan: number }) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-12 text-center text-[14px] text-ink-400">
      {message}
    </td>
  </tr>
)
