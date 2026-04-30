'use client'

import React, { useMemo, useState } from 'react'
import DeleteSaleButton from './DeleteSaleButton'
import { formatDateTime } from '@/utils/date'
import { Badge } from '@/components/ui/Badge'
import { TableShell, TableScroll, Table, Thead, Th, Tr, Td, TableEmpty } from '@/components/ui/Table'
import { FilterBar } from '@/components/filters/FilterBar'
import { FilterPanel, FilterSection } from '@/components/filters/FilterPanel'
import { FilterChip } from '@/components/filters/FilterChip'
import {
  MultiSelectPicker, DateRangePicker,
} from '@/components/filters/FilterPickers'
import {
  useTableFilters,
  stringSerializer, stringArraySerializer, dateRangeSerializer,
} from '@/components/filters/useTableFilters'

/** YYYY-MM-DD in the browser's local timezone. */
function localISO(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

type Sale = {
  sale_id: string
  product_code: string
  sale_date: string
  payment_mode: string
  tax_rate: number
  sale_amount: number | null
  is_voided: boolean
  patient_id: string | null
  recorded_by: string
  products: { sale_price_a: number | null } | null
  patients: { name: string; phone: string } | null
}

const filterSerializers = {
  q:        stringSerializer(),
  payment:  stringArraySerializer(),
  tax:      stringArraySerializer(),
  range:    dateRangeSerializer(), // server reads this; key stays 'range'
  voided:   stringSerializer(),    // 'hide' | '' (default = include)
}

const PAYMENT_OPTIONS = ['Cash', 'UPI', 'Card']
const TAX_OPTIONS = ['0', '5', '12', '18']

export default function ReportsTable({
  sales, role, rangeLabel,
}: { sales: Sale[]; role: string; rangeLabel: string }) {
  const [panelOpen, setPanelOpen] = useState(false)
  const { state: filters, setField, clearField, clearAll, replaceAll, activeCount } =
    useTableFilters(filterSerializers)

  // Date-range presets (set the URL `range` param; server refetches)
  const today = useMemo(() => new Date(), [])
  const setRangePreset = (preset: 'today' | 'week' | 'month') => {
    const to = new Date(today)
    const from = new Date(today)
    if (preset === 'today') {
      // from = to = today
    } else if (preset === 'week') {
      from.setDate(today.getDate() - 6)
    } else {
      from.setDate(1)
    }
    setField('range', { from: localISO(from), to: localISO(to) })
  }

  const isPreset = (key: 'today' | 'week' | 'month') => {
    if (!filters.range.from || !filters.range.to) return false
    const from = new Date(today)
    if (key === 'week') from.setDate(from.getDate() - 6)
    if (key === 'month') from.setDate(1)
    const expected = { from: localISO(from), to: localISO(today) }
    return filters.range.from === expected.from && filters.range.to === expected.to
  }

  // Client-side filtering on what the server returned
  const filteredSales = useMemo(() => {
    const q = filters.q.toLowerCase().trim()
    return sales.filter(s => {
      if (q) {
        const haystack = [
          s.product_code,
          s.patients?.name,
          s.patients?.phone,
        ].filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (filters.payment.length && !filters.payment.includes(s.payment_mode)) return false
      if (filters.tax.length && !filters.tax.includes(String(s.tax_rate))) return false
      if (filters.voided === 'hide' && s.is_voided) return false
      return true
    })
  }, [sales, filters])

  const getAccountPrice = (sale: Sale) => Number(sale.products?.sale_price_a || 0)

  return (
    <div className="space-y-5">
      <FilterBar>
        <FilterBar.Toolbar>
          <FilterBar.Search
            value={filters.q}
            onChange={v => setField('q', v)}
            placeholder="Search SKU, patient name, phone…"
          />
          <FilterBar.Presets>
            <FilterBar.Preset active={isPreset('today')} onClick={() => setRangePreset('today')}>Today</FilterBar.Preset>
            <FilterBar.Preset active={isPreset('week')} onClick={() => setRangePreset('week')}>Last 7 days</FilterBar.Preset>
            <FilterBar.Preset active={isPreset('month')} onClick={() => setRangePreset('month')}>This month</FilterBar.Preset>
            <FilterBar.Preset
              active={filters.voided === 'hide'}
              onClick={() => setField('voided', filters.voided === 'hide' ? '' : 'hide')}
            >
              Hide voided
            </FilterBar.Preset>
          </FilterBar.Presets>
          <FilterBar.OpenButton onClick={() => setPanelOpen(true)} count={activeCount} />
          <FilterBar.Actions>
            <FilterBar.Stats>
              <span className="font-medium text-ink-700 tabular">{filteredSales.length}</span>
              {' of '}
              <span className="tabular">{sales.length}</span> sales · <span>{rangeLabel}</span>
            </FilterBar.Stats>
          </FilterBar.Actions>
        </FilterBar.Toolbar>

        <FilterBar.Chips count={activeCount} onClearAll={clearAll}>
          {filters.q && <FilterChip key="q" label="Search:" value={`"${filters.q}"`} onClick={() => setPanelOpen(true)} onRemove={() => clearField('q')} />}
          {filters.payment.length > 0 && <FilterChip key="payment" label="Payment:" value={filters.payment.join(', ')} onClick={() => setPanelOpen(true)} onRemove={() => clearField('payment')} />}
          {filters.tax.length > 0 && <FilterChip key="tax" label="Tax:" value={filters.tax.map(t => `${t}%`).join(', ')} onClick={() => setPanelOpen(true)} onRemove={() => clearField('tax')} />}
          {(filters.range.from || filters.range.to) && <FilterChip key="range" label="Range:" value={`${filters.range.from ?? '…'} → ${filters.range.to ?? '…'}`} onClick={() => setPanelOpen(true)} onRemove={() => clearField('range')} />}
          {filters.voided === 'hide' && <FilterChip key="voided" label="Voided:" value="Hidden" onClick={() => setPanelOpen(true)} onRemove={() => clearField('voided')} />}
        </FilterBar.Chips>
      </FilterBar>

      <TableShell>
        <TableScroll>
          <Table minWidth={role === 'admin' ? 1080 : 920}>
            <Thead>
              <tr>
                <Th>Date & time</Th>
                <Th>SKU</Th>
                <Th>Patient</Th>
                <Th className="text-right">Amount (Accounts)</Th>
                <Th>Tax</Th>
                <Th>Payment</Th>
                {role === 'admin' && <Th className="text-right">Actions</Th>}
              </tr>
            </Thead>
            <tbody>
              {filteredSales.map(sale => (
                <Tr key={sale.sale_id} className={sale.is_voided ? 'opacity-50 line-through' : ''}>
                  <Td className="text-ink-600">{formatDateTime(sale.sale_date)}</Td>
                  <Td className="font-medium text-ink-900">{sale.product_code}</Td>
                  <Td className="text-ink-700">
                    {sale.patients ? (
                      <span>
                        <span className="font-medium">{sale.patients.name}</span>
                        <span className="ml-1 text-ink-400 tabular">· {sale.patients.phone}</span>
                      </span>
                    ) : <span className="text-ink-400 italic">Walk-in</span>}
                  </Td>
                  <Td className="text-right font-semibold text-ink-900">
                    ₹{getAccountPrice(sale).toLocaleString('en-IN')}
                  </Td>
                  <Td className="text-ink-600">{sale.tax_rate}%</Td>
                  <Td>
                    <Badge tone={sale.payment_mode === 'UPI' ? 'brand' : 'neutral'}>
                      {sale.payment_mode}
                    </Badge>
                    {sale.is_voided && <Badge tone="danger" className="ml-1">Voided</Badge>}
                  </Td>
                  {role === 'admin' && (
                    <Td className="text-right">
                      <DeleteSaleButton saleId={sale.sale_id} />
                    </Td>
                  )}
                </Tr>
              ))}
              {filteredSales.length === 0 && (
                <TableEmpty colSpan={role === 'admin' ? 7 : 6} message="No sales match your filters." />
              )}
            </tbody>
          </Table>
        </TableScroll>
      </TableShell>

      <FilterPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="Report filters"
        activeCount={activeCount}
        onClearAll={clearAll}
      >
        <FilterSection title="Date range">
          <DateRangePicker
            label="Range"
            value={filters.range}
            onChange={v => setField('range', v)}
          />
          <div className="text-[11.5px] text-ink-400">Server refetches sales when changed.</div>
        </FilterSection>

        <FilterSection title="Sale">
          <MultiSelectPicker
            label="Payment mode"
            options={PAYMENT_OPTIONS}
            value={filters.payment}
            onChange={v => setField('payment', v)}
            placeholder="Cash · UPI · Card"
          />
          <MultiSelectPicker
            label="Tax rate"
            options={TAX_OPTIONS}
            optionLabels={{ '0': '0%', '5': '5%', '12': '12%', '18': '18%' }}
            value={filters.tax}
            onChange={v => setField('tax', v)}
            placeholder="0% · 5% · 12% · 18%"
          />
        </FilterSection>
      </FilterPanel>
    </div>
  )
}
