'use client'

import React, { useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { formatDateTime } from '@/utils/date'

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

export default function PosRecentSalesTable({ sales: initialSales, canEdit }: { sales: RecentSale[], canEdit: boolean }) {
  const supabase = createClient()
  const [sales, setSales] = useState<RecentSale[]>(initialSales)
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentModeFilter, setPaymentModeFilter] = useState('')

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
      next.has(key) ? next.delete(key) : next.add(key)
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
    if (isNaN(newAmount) || newAmount < 0) { setFeedback('Invalid amount'); return }
    setIsSaving(true)
    const { error } = await supabase.from('sales').update({ sale_amount: newAmount }).eq('sale_id', saleId)
    if (error) {
      setFeedback('Could not update. Please try again.')
    } else {
      setSales(sales.map(s => s.sale_id === saleId ? { ...s, sale_amount: newAmount } : s))
      setEditingId(null)
      setFeedback(null)
    }
    setIsSaving(false)
  }

  const handleVoid = async (saleId: string) => {
    if (!confirm('Are you sure you want to void this sale? This will replenish stock and mark the sale as voided.')) return
    
    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.rpc('void_sale', { 
      target_sale_id: saleId, 
      admin_user_id: user.id 
    })

    if (error) {
      setFeedback(error.message)
    } else {
      setSales(sales.map(s => s.sale_id === saleId ? { ...s, is_voided: true } : s))
      setFeedback(null)
    }
    setIsSaving(false)
  }

  const thStyle: React.CSSProperties = {
    backgroundColor: '#f9fafb', fontWeight: 600, color: '#4b5563',
    padding: '0.625rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap', fontSize: '0.8rem',
  }

  const tdStyle: React.CSSProperties = {
    padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb',
    color: '#111827', fontSize: '0.875rem',
  }

  const subTdStyle: React.CSSProperties = {
    padding: '0.375rem 1rem 0.375rem 2rem', color: '#4b5563', fontSize: '0.8rem',
    borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb',
  }

  return (
    <div style={{ marginTop: '3rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>
        Recent Sales{' '}
        <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#6b7280' }}>
          (last 7 days · {cartGroups.length} transaction{cartGroups.length !== 1 ? 's' : ''})
        </span>
      </h2>

      {feedback && (
        <div style={{ padding: '0.5rem 1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.375rem', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
          {feedback}
        </div>
      )}

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by product code..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem', minWidth: '220px' }}
        />
        <select
          value={paymentModeFilter}
          onChange={e => setPaymentModeFilter(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', fontSize: '0.875rem' }}
        >
          <option value="">All payment modes</option>
          <option value="Cash">Cash</option>
          <option value="UPI">UPI</option>
          <option value="Card">Card</option>
        </select>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}></th>
              <th style={thStyle}>Date & Time</th>
              <th style={thStyle}>Items</th>
              <th style={thStyle}>Total (incl. tax)</th>
              <th style={thStyle}>Payment</th>
              <th style={thStyle}>Invoice</th>
              {canEdit && <th style={thStyle}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {cartGroups.map(group => {
              const key = group.transaction_id ?? group.items[0]?.sale_id
              const isExpanded = expandedKeys.has(key)
              const itemLabel = group.items.length === 1
                ? group.items[0].product_code
                : `${group.items.length} items`

              return (
                <React.Fragment key={key}>
                  <tr 
                    style={{ 
                      cursor: group.items.length > 1 ? 'pointer' : undefined,
                      opacity: group.is_voided ? 0.5 : 1,
                      textDecoration: group.is_voided ? 'line-through' : 'none'
                    }}
                    onClick={() => group.items.length > 1 && toggleExpand(key)}>
                    <td style={{ ...tdStyle, width: '32px', color: '#9ca3af', fontSize: '0.75rem', paddingRight: 0 }}>
                      {group.items.length > 1 ? (isExpanded ? '▾' : '▸') : ''}
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{formatDateTime(group.sale_date)}</td>
                    <td style={{ ...tdStyle, color: group.items.length > 1 ? '#1d4ed8' : '#111827', fontWeight: 500 }}>
                      {itemLabel} {group.is_voided && <span style={{ color: '#dc2626', fontSize: '0.7rem' }}>[VOIDED]</span>}
                    </td>
                    <td style={tdStyle}>
                      <strong>₹{group.totalWithTax.toFixed(2)}</strong>
                      {group.totalWithTax !== group.subtotal && (
                        <span style={{ color: '#9ca3af', fontSize: '0.75rem', marginLeft: '4px' }}>
                          (₹{group.subtotal.toFixed(0)} + tax)
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '0.2rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 500,
                        backgroundColor: group.payment_mode === 'UPI' ? '#dbeafe' : '#dcfce7',
                        color: group.payment_mode === 'UPI' ? '#1e40af' : '#166534',
                      }}>
                        {group.payment_mode}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {group.transaction_id && !group.is_voided ? (
                        <a
                          href={`/dashboard/invoice/${group.transaction_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500 }}
                        >
                          🖨 Print
                        </a>
                      ) : (
                        <span style={{ color: '#d1d5db', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                    {canEdit && <td style={tdStyle}></td>}
                  </tr>

                  {isExpanded && group.items.map(item => {
                    const isEditing = editingId === item.sale_id
                    const taxAmt = Number(item.sale_amount) * (Number(item.tax_rate) / 100)
                    return (
                      <tr key={item.sale_id} style={{ backgroundColor: '#f9fafb', opacity: item.is_voided ? 0.6 : 1 }}>
                        <td style={subTdStyle}></td>
                        <td style={subTdStyle}></td>
                        <td style={{ ...subTdStyle, textDecoration: item.is_voided ? 'line-through' : 'none' }}>
                          {item.product_code} {item.is_voided && <span style={{ color: '#dc2626', fontSize: '0.7rem' }}>[VOIDED]</span>}
                        </td>
                        <td style={{ ...subTdStyle, textDecoration: item.is_voided ? 'line-through' : 'none' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                              <input
                                type="number"
                                value={editAmount}
                                onChange={e => setEditAmount(e.target.value)}
                                style={{ width: '80px', padding: '0.2rem 0.4rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', fontSize: '0.8rem' }}
                                autoFocus
                                onClick={e => e.stopPropagation()}
                              />
                              <button onClick={e => { e.stopPropagation(); saveEdit(item.sale_id) }} disabled={isSaving}
                                style={{ padding: '0.2rem 0.4rem', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.7rem' }}>
                                {isSaving ? '…' : '✓'}
                              </button>
                              <button onClick={e => { e.stopPropagation(); cancelEdit() }}
                                style={{ padding: '0.2rem 0.4rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.7rem' }}>
                                ✕
                              </button>
                            </div>
                          ) : (
                            <>₹{item.sale_amount} <span style={{ color: '#9ca3af' }}>+{item.tax_rate}% (₹{taxAmt.toFixed(0)})</span></>
                          )}
                        </td>
                        <td style={subTdStyle}></td>
                        <td style={subTdStyle}></td>
                        {canEdit && (
                          <td style={subTdStyle}>
                            {!isEditing && !item.is_voided && (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={e => { e.stopPropagation(); startEdit(item) }}
                                  style={{ background: 'transparent', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.7rem' }}>
                                  Edit
                                </button>
                                <button onClick={e => { e.stopPropagation(); handleVoid(item.sale_id) }}
                                  style={{ background: 'transparent', color: '#dc2626', border: '1px solid #fecaca', padding: '0.15rem 0.4rem', borderRadius: '0.2rem', cursor: 'pointer', fontSize: '0.7rem' }}>
                                  Void
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </React.Fragment>
              )
            })}
            {cartGroups.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 7 : 6} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  No sales found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
