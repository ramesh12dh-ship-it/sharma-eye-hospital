'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  activeCount: number
  onClearAll: () => void
  children: React.ReactNode
}

/** Right-side slide-in drawer for filter controls. */
export function FilterPanel({
  open, onClose, title = 'Filters', activeCount, onClearAll, children,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <button
        aria-label="Close filter panel"
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-ink-900/30 backdrop-blur-[2px] transition-opacity duration-[var(--duration-base)]',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-label={title}
        aria-modal="true"
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col bg-white shadow-[var(--shadow-lift)]',
          'transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-soft)]',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-semibold tracking-tight text-ink-900">{title}</h2>
            {activeCount > 0 && (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11.5px] font-semibold text-brand-700">
                {activeCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {activeCount > 0 && (
              <button
                onClick={onClearAll}
                className="rounded-md px-2.5 py-1 text-[12.5px] font-medium text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {children}
        </div>
      </aside>
    </>
  )
}

/** Visual divider for groups of filters within a panel. */
export function FilterSection({
  title, children,
}: { title?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      {title && (
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-400">
          {title}
        </div>
      )}
      {children}
    </div>
  )
}
