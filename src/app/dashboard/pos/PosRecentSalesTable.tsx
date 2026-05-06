'use client'

import React, { useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { formatDateTime } from '@/utils/date'
import Link from 'next/link'
import { ChevronDown, ChevronRight, Printer, Pencil, Ban, X, Check } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Badge, OrderStatusBadge } from '@/components/ui/Badge'
import { TableShell, TableScroll, Table, Thead, Th, Tr, Td, TableEmpty } from '@/components/ui/Table'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

type RecentSale = {
  sale_id: string
  product_code: string
  sale_date: string
  payment_mode: string
  sale_amount: number
  tax_rate: number
  transaction_id: string | null
  is_voided: boolean
}

type OpticalOrderStatus = {
  transaction_id: string
  status: 'ordered' | 'in_workshop' | 'ready' | 'delivered' | 'cancelled'
}

type CartGroup = {
  transaction_id: string | null
  sale_date: string
  payment_mode: string
  items: RecentSale[]
  subtotal: number
  totalWithTax: number
  is_voided: boolean
}

function groupByTransaction(sales: RecentSale[]): CartGroup[] {
  const map = new Map<string, CartGroup>()
  for (const sale of sales) {
    const key = sale.transaction_id ?? sale.sale_id
    if (!map.has(key)) {
      map.set(key, {
        transaction_id: sale.transaction_id,
        sale_date: sale.sale_date,
        payment_mode: sale.payment_mode,
        items: [],
        subtotal: 0,
        totalWithTax: 0,
        is_voided: false,
      })
    }
    const group = map.get(key)!
    group.items.push(sale)
    if (!sale.is_voided) {
      const amt = Number(sale.sale_amount)
      group.subtotal += amt
      group.totalWithTax += amt + amt * (Number(sale.tax_rate) / 100)
    }
    group.is_voided = group.items.every(i => i.is_voided)
  }
  return Array.from(map.values())
}

export default function PosRecentSalesTable({
  sales: initialSales, orders, canEdit,
}: { sales: RecentSale[]; orders: OpticalOrderStatus[]; canEdit: boolean }) {
  const supabase = createClient()
  const [sales, setSales] = useState<RecentSale[]>(initialSales)
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentModeFilter] = useState('')

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchesSearch = !searchQuery || s.product_code.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPayment = !paymentModeFilter || s.payment_mode === paymentModeFilter
      return matchesSearch && matchesPayment
    })
  }, [sales, searchQuery, paymentModeFilter])

  const cartGroups = useMemo(() => groupByTransaction(filteredSales), [filteredSales])

  const toggleExpand = (key: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const startEdit = (sale: RecentSale) => {
    if (sale.is_voided) return
    setEditingId(sale.sale_id)
    setEditAmount(String(sale.sale_amount))
    setFeedback(null)
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = async (saleId: string) => {
    const newAmount = parseFloat(editAmount)
    if (isNaN(newAmount) || newAmount < 0) { toast.error('Invalid amount'); return }
    setIsSaving(true)
    const { error } = await supabase.from('sales').update({ sale_amount: newAmount }).eq('sale_id', saleId)
    if (error) {
      toast.error('Could not update sale', error.message)
    } else {
      setSales(sales.map(s => s.sale_id === saleId ? { ...s, sale_amount: newAmount } : s))
      setEditingId(null)
      toast.success('Sale amount updated')
    }
    setIsSaving(false)
  }

  const handleVoid = async (saleId: string) => {
    if (!confirm('Cancel this sale? Stock will be restored.')) return
    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not signed in'); setIsSaving(false); return }
    const { error } = await supabase.rpc('void_sale', { target_sale_id: saleId, admin_user_id: user.id })
    if (error) {
      toast.error('Could not cancel sale', error.message)
    } else {
      setSales(sales.map(s => s.sale_id === saleId ? { ...s, is_voided: true } : s))
      toast.success('Sale cancelled, stock restored')
    }
    setIsSaving(false)
  }

  /** Cancel every line in a multi-item transaction. */
  const handleCancelGroup = async (saleIds: string[]) => {
    if (!confirm(`Cancel all ${saleIds.length} items in this sale? Stock will be restored.`)) return
    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not signed in'); setIsSaving(false); return }

    let succeeded = 0
    let firstError: string | null = null
    for (const id of saleIds) {
      const { error } = await supabase.rpc('void_sale', { target_sale_id: id, admin_user_id: user.id })
      if (!error) succeeded++
      else if (!firstError) firstError = error.message
    }

    if (succeeded > 0) {
      const cancelledSet = new Set(saleIds.slice(0, succeeded))
      setSales(sales.map(s => cancelledSet.has(s.sale_id) ? { ...s, is_voided: true } : s))
    }
    if (firstError) {
      toast.error(`Cancelled ${succeeded} of ${saleIds.length}`, firstError)
    } else {
      toast.success(`Cancelled ${succeeded} item${succeeded === 1 ? '' : 's'}, stock restored`)
    }
    setIsSaving(false)
  }

  const getOrderStatus = (transactionId: string | null) => {
    if (!transactionId) return null
    return orders.find(o => o.transaction_id === transactionId)?.status || null
  }

  return (
    <section className="mt-12">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-semibold tracking-tight text-ink-900">Recent sales</h2>
          <p className="mt-0.5 text-[12px] text-ink-500">Last 7 days</p>
        </div>
        <Input
          type="text"
          placeholder="Search by product code…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {feedback && (
        <div className="mb-3 rounded-lg border border-coral-200 bg-coral-50 px-4 py-2.5 text-[13px] text-coral-700">
          {feedback}
        </div>
      )}

      <TableShell>
        <TableScroll>
          <Table minWidth={canEdit ? 1040 : 860}>
            <Thead>
              <tr>
                <Th className="w-8" />
                <Th>Date & time</Th>
                <Th>Items</Th>
                <Th>Status</Th>
                <Th>Total</Th>
                <Th>Payment</Th>
                <Th>Invoice</Th>
                {canEdit && <Th className="text-right">Actions</Th>}
              </tr>
            </Thead>
            <tbody>
              {cartGroups.length === 0 && (
                <TableEmpty colSpan={canEdit ? 8 : 7} message="No recent sales." />
              )}
              {cartGroups.map(group => {
                const key = group.transaction_id ?? group.items[0]?.sale_id
                const isExpanded = expandedKeys.has(key)
                const orderStatus = getOrderStatus(group.transaction_id)
                const isMulti = group.items.length > 1
                const itemLabel = isMulti ? `${group.items.length} items` : group.items[0].product_code
                const onlyItem = group.items[0]
                const isEditingThis = !isMulti && editingId === onlyItem.sale_id

                return (
                  <React.Fragment key={key}>
                    <Tr
                      onClick={() => isMulti && toggleExpand(key)}
                      className={cn(
                        isMulti && 'cursor-pointer',
                        group.is_voided && 'opacity-50 line-through',
                      )}
                    >
                      <Td className="w-8 pr-0 text-ink-400">
                        {isMulti ? (
                          isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                        ) : null}
                      </Td>
                      <Td className="whitespace-nowrap text-ink-600">{formatDateTime(group.sale_date)}</Td>
                      <Td className={cn('font-medium', isMulti ? 'text-brand-700' : 'text-ink-900')}>
                        {itemLabel}
                      </Td>
                      <Td>
                        {orderStatus ? (
                          <Link href="/dashboard/orders" onClick={e => e.stopPropagation()}>
                            <OrderStatusBadge status={orderStatus} />
                          </Link>
                        ) : <span className="text-ink-300">—</span>}
                      </Td>
                      <Td className="font-semibold text-ink-900">
                        ₹{group.totalWithTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </Td>
                      <Td>
                        <Badge tone={group.payment_mode === 'UPI' ? 'brand' : 'neutral'}>
                          {group.payment_mode}
                        </Badge>
                      </Td>
                      <Td>
                        {group.transaction_id && !group.is_voided ? (
                          <a
                            href={`/invoice/${group.transaction_id}`}
                            target="_blank"
                            onClick={e => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[12.5px] font-medium text-brand-600 hover:text-brand-800"
                          >
                            <Printer size={13} /> Print
                          </a>
                        ) : <span className="text-ink-300">—</span>}
                      </Td>
                      {canEdit && (
                        <Td className="text-right">
                          {!group.is_voided && !isEditingThis && (
                            isMulti ? (
                              <div className="flex justify-end">
                                <button
                                  onClick={e => {
                                    e.stopPropagation()
                                    handleCancelGroup(group.items.filter(i => !i.is_voided).map(i => i.sale_id))
                                  }}
                                  className="inline-flex items-center gap-1 rounded-md border border-coral-200 bg-coral-50/60 px-1.5 py-0.5 text-[11.5px] font-medium text-coral-700 hover:bg-coral-100"
                                >
                                  <Ban size={11} /> Cancel all
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-1">
                                <button
                                  onClick={e => { e.stopPropagation(); startEdit(onlyItem) }}
                                  className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50/60 px-1.5 py-0.5 text-[11.5px] font-medium text-brand-700 hover:bg-brand-100"
                                >
                                  <Pencil size={11} /> Edit
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); handleVoid(onlyItem.sale_id) }}
                                  className="inline-flex items-center gap-1 rounded-md border border-coral-200 bg-coral-50/60 px-1.5 py-0.5 text-[11.5px] font-medium text-coral-700 hover:bg-coral-100"
                                >
                                  <Ban size={11} /> Cancel
                                </button>
                              </div>
                            )
                          )}
                          {isEditingThis && (
                            <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                              <Input
                                type="number"
                                value={editAmount}
                                onChange={e => setEditAmount(e.target.value)}
                                className="h-7 w-24 px-2 text-[12px]"
                              />
                              <button
                                onClick={() => saveEdit(onlyItem.sale_id)}
                                disabled={isSaving}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
                              >
                                <Check size={13} />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-hairline text-ink-500 hover:bg-ink-100"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          )}
                        </Td>
                      )}
                    </Tr>

                    {isExpanded &&
                      group.items.map(item => {
                        const isItemEditing = editingId === item.sale_id
                        return (
                          <Tr
                            key={item.sale_id}
                            className={cn('bg-ink-50/60 hover:bg-ink-50', item.is_voided && 'opacity-60 line-through')}
                          >
                            <Td />
                            <Td />
                            <Td className="pl-8 text-[12.5px] text-ink-700">{item.product_code}</Td>
                            <Td />
                            <Td className="text-ink-700">
                              ₹{Number(item.sale_amount).toLocaleString('en-IN')}
                            </Td>
                            <Td />
                            <Td />
                            {canEdit && (
                              <Td className="text-right">
                                {!item.is_voided && !isItemEditing && (
                                  <div className="flex justify-end gap-1">
                                    <button
                                      onClick={e => { e.stopPropagation(); startEdit(item) }}
                                      className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50/60 px-1.5 py-0.5 text-[11px] font-medium text-brand-700 hover:bg-brand-100"
                                    >
                                      <Pencil size={10} /> Edit
                                    </button>
                                    <button
                                      onClick={e => { e.stopPropagation(); handleVoid(item.sale_id) }}
                                      className="inline-flex items-center gap-1 rounded-md border border-coral-200 bg-coral-50/60 px-1.5 py-0.5 text-[11px] font-medium text-coral-700 hover:bg-coral-100"
                                    >
                                      <Ban size={10} /> Cancel
                                    </button>
                                  </div>
                                )}
                                {isItemEditing && (
                                  <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                                    <Input
                                      type="number"
                                      value={editAmount}
                                      onChange={e => setEditAmount(e.target.value)}
                                      className="h-7 w-20 px-2 text-[12px]"
                                    />
                                    <button
                                      onClick={() => saveEdit(item.sale_id)}
                                      disabled={isSaving}
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
                                    >
                                      <Check size={12} />
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-hairline text-ink-500 hover:bg-ink-100"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                )}
                              </Td>
                            )}
                          </Tr>
                        )
                      })}
                  </React.Fragment>
                )
              })}
            </tbody>
          </Table>
        </TableScroll>
      </TableShell>
    </section>
  )
}
