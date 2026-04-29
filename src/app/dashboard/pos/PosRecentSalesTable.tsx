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
}

export default function PosRecentSalesTable({ sales: initialSales, canEdit }: { sales: RecentSale[], canEdit: boolean }) {
  const supabase = createClient()
  const [sales, setSales] = useState<RecentSale[]>(initialSales)
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentModeFilter, setPaymentModeFilter] = useState('')

  // Inline edit state
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

  const startEdit = (sale: RecentSale) => {
    setEditingId(sale.sale_id)
    setEditAmount(String(sale.sale_amount))
    setFeedback(null)
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = async (saleId: string) => {
    const newAmount = parseFloat(editAmount)
    if (isNaN(newAmount) || newAmount < 0) {
      setFeedback('Invalid amount')
      return
    }
    setIsSaving(true)
    const { error } = await supabase
      .from('sales')
      .update({ sale_amount: newAmount })
      .eq('sale_id', saleId)

    if (error) {
      setFeedback('Could not update. Please try again.')
    } else {
      setSales(sales.map(s => s.sale_id === saleId ? { ...s, sale_amount: newAmount } : s))
      setEditingId(null)
      setFeedback(null)
    }
    setIsSaving(false)
  }

  const cellStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #e5e7eb',
    color: '#111827',
    whiteSpace: 'nowrap',
    fontSize: '0.875rem',
  }

  const thStyle: React.CSSProperties = {
    backgroundColor: '#f9fafb',
    fontWeight: 600,
    color: '#4b5563',
    padding: '0.75rem 1rem',
    textAlign: 'left',
    borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={{ marginTop: '3rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>
        Recent Sales <span style={{ fontSize: '0.875rem', fontWeight: 400, color: '#6b7280' }}>(last 7 days)</span>
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
        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{filteredSales.length} sale(s)</span>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Date & Time</th>
              <th style={thStyle}>Product (SKU)</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Tax</th>
              <th style={thStyle}>Payment</th>
              <th style={thStyle}>Invoice</th>
              {canEdit && <th style={thStyle}>Edit</th>}
            </tr>
          </thead>
          <tbody>
            {filteredSales.map(sale => {
              const isEditing = editingId === sale.sale_id
              const taxAmt = sale.sale_amount * (sale.tax_rate / 100)
              return (
                <tr key={sale.sale_id} style={{ backgroundColor: isEditing ? '#fffbeb' : undefined }}>
                  <td style={cellStyle}>{formatDateTime(sale.sale_date)}</td>
                  <td style={{ ...cellStyle, fontWeight: 500 }}>{sale.product_code}</td>

                  {/* Amount — inline editable */}
                  <td style={cellStyle}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                        <input
                          type="number"
                          value={editAmount}
                          onChange={e => setEditAmount(e.target.value)}
                          style={{ width: '90px', padding: '0.25rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', fontSize: '0.875rem' }}
                          autoFocus
                        />
                        <button
                          onClick={() => saveEdit(sale.sale_id)}
                          disabled={isSaving}
                          style={{ padding: '0.25rem 0.5rem', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          {isSaving ? '…' : '✓'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={{ padding: '0.25rem 0.5rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <strong>₹{sale.sale_amount}</strong>
                    )}
                  </td>

                  <td style={{ ...cellStyle, color: '#6b7280' }}>
                    {sale.tax_rate}% {taxAmt > 0 && <span>(₹{taxAmt.toFixed(0)})</span>}
                  </td>

                  <td style={cellStyle}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      backgroundColor: sale.payment_mode === 'UPI' ? '#dbeafe' : '#dcfce7',
                      color: sale.payment_mode === 'UPI' ? '#1e40af' : '#166534',
                    }}>
                      {sale.payment_mode}
                    </span>
                  </td>

                  {/* Invoice link */}
                  <td style={cellStyle}>
                    {sale.transaction_id ? (
                      <a
                        href={`/dashboard/invoice/${sale.transaction_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                      >
                        🖨 Print
                      </a>
                    ) : (
                      <span style={{ color: '#d1d5db', fontSize: '0.75rem' }}>—</span>
                    )}
                  </td>

                  {/* Edit button */}
                  {canEdit && (
                    <td style={cellStyle}>
                      {!isEditing && (
                        <button
                          onClick={() => startEdit(sale)}
                          style={{ background: 'transparent', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
            {filteredSales.length === 0 && (
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
