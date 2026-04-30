'use client'

import React, { useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { formatDateTime, formatDate } from '@/utils/date'
import { ClipboardList, Phone, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { toast } from '@/components/ui/Toast'
import { eyeStr, hasAnyRx } from '@/utils/optics'
import { FilterBar } from '@/components/filters/FilterBar'
import { FilterPanel, FilterSection } from '@/components/filters/FilterPanel'
import { FilterChip } from '@/components/filters/FilterChip'
import { MultiSelectPicker, DateRangePicker } from '@/components/filters/FilterPickers'
import {
  useTableFilters, stringSerializer, stringArraySerializer, dateRangeSerializer,
} from '@/components/filters/useTableFilters'
import { cn } from '@/lib/utils'

type Order = {
  order_id: string
  transaction_id: string
  patient_id: string
  status: 'ordered' | 'in_workshop' | 'ready' | 'delivered' | 'cancelled'
  notes: string | null
  expected_date: string | null
  actual_delivery: string | null
  created_at: string
  patients: { name: string; phone: string } | null
  // Rx snapshot (migration 010) — present once that migration runs
  r_sph: number | null; r_cyl: number | null; r_axis: number | null; r_add: number | null
  l_sph: number | null; l_cyl: number | null; l_axis: number | null; l_add: number | null
  pd: number | null
  rx_notes: string | null
}

const filterSerializers = {
  q:      stringSerializer(),
  status: stringArraySerializer(),
  due:    dateRangeSerializer(),
}

const STATUS_OPTIONS = ['ordered', 'in_workshop', 'ready', 'cancelled']
const STATUS_LABELS: Record<string, string> = {
  ordered: 'Ordered', in_workshop: 'In workshop', ready: 'Ready',
  delivered: 'Delivered', cancelled: 'Cancelled',
}

export default function OrdersList({
  initialActiveOrders, initialDeliveredOrders, userRole,
}: {
  initialActiveOrders: Order[]
  initialDeliveredOrders: Order[]
  userRole: string
}) {
  const supabase = createClient()
  const [activeOrders, setActiveOrders] = useState<Order[]>(initialActiveOrders)
  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>(initialDeliveredOrders)
  const [view, setView] = useState<'active' | 'delivered'>('active')
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const { state: filters, setField, clearField, clearAll, activeCount } =
    useTableFilters(filterSerializers)

  const updateStatus = async (orderId: string, newStatus: Order['status']) => {
    setIsUpdating(orderId)
    const updateData: any = { status: newStatus }
    if (newStatus === 'delivered') updateData.actual_delivery = new Date().toISOString()
    const { error } = await supabase.from('optical_orders').update(updateData).eq('order_id', orderId)
    if (error) {
      toast.error('Could not update order', error.message)
      setIsUpdating(null)
      return
    }
    const updatedOrder = [...activeOrders, ...deliveredOrders].find(o => o.order_id === orderId)
    if (updatedOrder) {
      const fresh = { ...updatedOrder, ...updateData }
      if (newStatus === 'delivered') {
        setActiveOrders(activeOrders.filter(o => o.order_id !== orderId))
        setDeliveredOrders([fresh, ...deliveredOrders].slice(0, 20))
        toast.success('Marked delivered')
      } else {
        setActiveOrders(activeOrders.map(o => (o.order_id === orderId ? fresh : o)))
        if (newStatus === 'cancelled') toast.info('Order cancelled')
      }
    }
    setIsUpdating(null)
  }

  // Presets — use local date components (not UTC) to match user's day boundary
  const todayStr = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()
  const isReadyPreset = filters.status.length === 1 && filters.status[0] === 'ready'
  const isOverduePreset =
    filters.due.from === undefined &&
    filters.due.to === todayStr
  const applyReady = () => {
    if (isReadyPreset) clearField('status')
    else setField('status', ['ready'])
  }
  const applyOverdue = () => {
    if (isOverduePreset) {
      clearField('due')
    } else {
      setField('due', { from: undefined, to: todayStr })
    }
  }

  // Filter the active or delivered list based on URL state + tab
  const sourceOrders = view === 'active' ? activeOrders : deliveredOrders
  const filteredOrders = useMemo(() => {
    const q = filters.q.toLowerCase().trim()
    return sourceOrders.filter(o => {
      if (q) {
        const hay = [o.patients?.name, o.patients?.phone].filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      // Status filter — only meaningful in active tab; delivered tab is implicitly 'delivered'
      if (view === 'active' && filters.status.length && !filters.status.includes(o.status)) return false
      // Due-date filter (compares against expected_date)
      if (filters.due.from || filters.due.to) {
        if (!o.expected_date) return false
        const d = o.expected_date.slice(0, 10)
        if (filters.due.from && d < filters.due.from) return false
        if (filters.due.to && d > filters.due.to) return false
      }
      return true
    })
  }, [sourceOrders, filters, view])

  return (
    <div>
      {/* Filter bar */}
      <FilterBar className="mb-5">
        <FilterBar.Toolbar>
          <FilterBar.Search
            value={filters.q}
            onChange={v => setField('q', v)}
            placeholder="Search by patient name or phone…"
          />
          <FilterBar.Presets>
            <FilterBar.Preset active={isReadyPreset} onClick={applyReady}>Ready for pickup</FilterBar.Preset>
            <FilterBar.Preset active={isOverduePreset} onClick={applyOverdue}>Overdue</FilterBar.Preset>
          </FilterBar.Presets>
          <FilterBar.OpenButton onClick={() => setPanelOpen(true)} count={activeCount} />
          <FilterBar.Actions>
            <FilterBar.Stats>
              <span className="font-medium text-ink-700 tabular">{filteredOrders.length}</span>
              {' of '}
              <span className="tabular">{sourceOrders.length}</span>
              {' '}{view === 'active' ? 'active' : 'delivered'}
            </FilterBar.Stats>
          </FilterBar.Actions>
        </FilterBar.Toolbar>

        <FilterBar.Chips count={activeCount} onClearAll={clearAll}>
          {filters.q && <FilterChip label="Search:" value={`"${filters.q}"`} onClick={() => setPanelOpen(true)} onRemove={() => clearField('q')} />}
          {filters.status.length > 0 && <FilterChip label="Status:" value={filters.status.map(s => STATUS_LABELS[s] ?? s).join(', ')} onClick={() => setPanelOpen(true)} onRemove={() => clearField('status')} />}
          {(filters.due.from || filters.due.to) && <FilterChip label="Due:" value={`${filters.due.from ?? '…'} → ${filters.due.to ?? '…'}`} onClick={() => setPanelOpen(true)} onRemove={() => clearField('due')} />}
        </FilterBar.Chips>
      </FilterBar>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-hairline">
        <TabButton active={view === 'active'} onClick={() => setView('active')}>
          Active <span className="ml-1.5 rounded-full bg-brand-100 px-1.5 text-[11px] text-brand-700">{activeOrders.length}</span>
        </TabButton>
        <TabButton active={view === 'delivered'} onClick={() => setView('delivered')}>
          Delivered history
        </TabButton>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-hairline bg-white text-ink-400">
            <ClipboardList size={20} strokeWidth={1.5} />
          </div>
          <p className="text-[14px] text-ink-500">
            {sourceOrders.length === 0
              ? 'No orders in this section.'
              : 'No orders match your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredOrders.map(order => (
            <OrderCard
              key={order.order_id}
              order={order}
              isUpdating={isUpdating === order.order_id}
              onUpdate={updateStatus}
              view={view}
            />
          ))}
        </div>
      )}

      <FilterPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="Order filters"
        activeCount={activeCount}
        onClearAll={clearAll}
      >
        {view === 'active' && (
          <FilterSection title="Status">
            <MultiSelectPicker
              label="Active statuses"
              options={STATUS_OPTIONS}
              optionLabels={STATUS_LABELS}
              value={filters.status}
              onChange={v => setField('status', v)}
              placeholder="Ordered · In workshop · Ready · Cancelled"
            />
          </FilterSection>
        )}
        <FilterSection title="Due date">
          <DateRangePicker
            label="Expected delivery between"
            value={filters.due}
            onChange={v => setField('due', v)}
          />
        </FilterSection>
      </FilterPanel>
    </div>
  )
}

function TabButton({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative px-4 py-2.5 text-[14px] font-medium transition-colors',
        active ? 'text-brand-700' : 'text-ink-500 hover:text-ink-800',
      )}
    >
      {children}
      {active && (
        <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] rounded-t-full bg-brand-500" />
      )}
    </button>
  )
}

function OrderCard({
  order, isUpdating, onUpdate, view,
}: {
  order: Order
  isUpdating: boolean
  onUpdate: (id: string, status: Order['status']) => void
  view: 'active' | 'delivered'
}) {
  const isOverdue =
    order.expected_date && new Date(order.expected_date) < new Date() && view === 'active'

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold tracking-tight text-ink-900">
            {order.patients?.name ?? 'Unknown patient'}
          </h3>
          <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-ink-500 tabular">
            <Phone size={11} /> {order.patients?.phone ?? '—'}
          </div>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="flex-1 space-y-3 px-5 pb-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ordered" value={formatDate(order.created_at)} />
          <Field
            label="Due"
            value={order.expected_date ? formatDate(order.expected_date) : 'Not set'}
            tone={isOverdue ? 'overdue' : 'normal'}
          />
        </div>

        {hasAnyRx(order) && (
          <div className="rounded-lg border border-brand-200 bg-brand-50/40 p-3">
            <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-brand-700">
              Prescription
            </div>
            <dl className="space-y-0.5 tabular text-[13px]">
              {(() => {
                const re = eyeStr(order.r_sph, order.r_cyl, order.r_axis, order.r_add)
                const le = eyeStr(order.l_sph, order.l_cyl, order.l_axis, order.l_add)
                return (
                  <>
                    {re && (
                      <div className="flex gap-2">
                        <dt className="w-7 font-semibold text-brand-700">RE</dt>
                        <dd className="text-ink-800">{re}</dd>
                      </div>
                    )}
                    {le && (
                      <div className="flex gap-2">
                        <dt className="w-7 font-semibold text-brand-700">LE</dt>
                        <dd className="text-ink-800">{le}</dd>
                      </div>
                    )}
                    {order.pd != null && (
                      <div className="text-[12px] text-ink-600">
                        <span className="font-medium">PD:</span> {order.pd} mm
                      </div>
                    )}
                  </>
                )
              })()}
            </dl>
          </div>
        )}

        {order.notes && (
          <div className="rounded-lg border border-hairline bg-ink-50/50 p-3">
            <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
              Workshop notes
            </div>
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-700">
              {order.notes}
            </p>
          </div>
        )}
      </div>

      {view === 'active' ? (
        <div className="flex flex-wrap gap-2 border-t border-hairline bg-ink-50/30 px-5 py-3">
          {order.status === 'ordered' && (
            <Button
              size="sm" disabled={isUpdating}
              className="flex-1"
              onClick={() => onUpdate(order.order_id, 'in_workshop')}
            >
              Send to workshop <ArrowRight size={12} />
            </Button>
          )}
          {order.status === 'in_workshop' && (
            <Button
              size="sm" disabled={isUpdating}
              className="flex-1 bg-accent-600 hover:bg-accent-700"
              onClick={() => onUpdate(order.order_id, 'ready')}
            >
              Mark ready <ArrowRight size={12} />
            </Button>
          )}
          {order.status === 'ready' && (
            <Button
              size="sm" disabled={isUpdating}
              className="flex-1"
              onClick={() => onUpdate(order.order_id, 'delivered')}
            >
              Mark delivered <ArrowRight size={12} />
            </Button>
          )}
          <Button
            size="sm" variant="danger" disabled={isUpdating}
            onClick={() => { if (confirm('Cancel this order?')) onUpdate(order.order_id, 'cancelled') }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div className="border-t border-hairline bg-ink-50/30 px-5 py-3 text-[12px] text-ink-500">
          Delivered {order.actual_delivery ? formatDateTime(order.actual_delivery) : '—'}
        </div>
      )}
    </Card>
  )
}

function Field({
  label, value, tone = 'normal',
}: { label: string; value: string; tone?: 'normal' | 'overdue' }) {
  return (
    <div>
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
        {label}
      </div>
      <div
        className={cn(
          'mt-0.5 text-[13.5px] tabular',
          tone === 'overdue' ? 'font-semibold text-coral-600' : 'text-ink-800',
        )}
      >
        {value}
      </div>
    </div>
  )
}
