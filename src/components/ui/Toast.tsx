'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastTone = 'success' | 'error' | 'info'
type ToastItem = {
  id: number
  message: string
  tone: ToastTone
  /** Optional secondary line for context (e.g. error detail). */
  detail?: string
}

// Module-level listener registry so any client component can call `toast(...)`
// without threading a context through the tree.
type Listener = (t: Omit<ToastItem, 'id'>) => void
let listeners: Listener[] = []

export function toast(message: string, tone: ToastTone = 'info', detail?: string) {
  for (const l of listeners) l({ message, tone, detail })
}
toast.success = (m: string, d?: string) => toast(m, 'success', d)
toast.error   = (m: string, d?: string) => toast(m, 'error', d)
toast.info    = (m: string, d?: string) => toast(m, 'info', d)

const AUTO_DISMISS_MS: Record<ToastTone, number> = {
  success: 3500,
  info:    4000,
  error:   6500, // give the user a little longer to read errors
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    const fn: Listener = next => {
      const id = Date.now() + Math.random()
      setItems(prev => [...prev, { ...next, id }])
      const ms = AUTO_DISMISS_MS[next.tone] ?? 4000
      setTimeout(() => {
        setItems(prev => prev.filter(t => t.id !== id))
      }, ms)
    }
    listeners.push(fn)
    return () => { listeners = listeners.filter(l => l !== fn) }
  }, [])

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end sm:px-0"
    >
      {items.map(t => (
        <ToastView key={t.id} item={t} onDismiss={() => setItems(prev => prev.filter(x => x.id !== t.id))} />
      ))}
    </div>
  )
}

function ToastView({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const styles = {
    success: { border: 'border-accent-200', bg: 'bg-accent-50', text: 'text-accent-700', Icon: CheckCircle2 },
    error:   { border: 'border-coral-200',  bg: 'bg-coral-50',  text: 'text-coral-700',  Icon: AlertCircle },
    info:    { border: 'border-brand-200',  bg: 'bg-brand-50',  text: 'text-brand-700',  Icon: Info },
  }[item.tone]
  const Icon = styles.Icon

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-[var(--shadow-lift)]',
        'animate-fade-in',
        styles.border, styles.bg, styles.text,
      )}
    >
      <Icon size={17} className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-medium leading-snug">{item.message}</div>
        {item.detail && (
          <div className="mt-0.5 text-[12px] opacity-80 leading-snug whitespace-pre-wrap break-words">
            {item.detail}
          </div>
        )}
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-0.5 opacity-60 transition-opacity hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  )
}
