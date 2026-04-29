"use client"

import React, { useState, useMemo } from 'react'

type RecentSale = {
  sale_id: string
  product_code: string
  sale_date: string
  payment_mode: string
  sale_amount: number
}

export default function PosRecentSalesTable({ sales }: { sales: RecentSale[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentModeFilter, setPaymentModeFilter] = useState('')

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchesSearch = !searchQuery || s.product_code.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPayment = !paymentModeFilter || s.payment_mode === paymentModeFilter
      return matchesSearch && matchesPayment
    })
  }, [sales, searchQuery, paymentModeFilter])

  return (
    <div style={{ marginTop: '3rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Recent Sales (Last 7 Days)</h2>
      
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="Search by Product Code..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', width: '100%', maxWidth: '400px' }}
        />
        <div style={{ marginLeft: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
          Showing {filteredSales.length} sales
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ backgroundColor: '#f9fafb', fontWeight: 600, color: '#4b5563', padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Date & Time</th>
              <th style={{ backgroundColor: '#f9fafb', fontWeight: 600, color: '#4b5563', padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Product Code</th>
              <th style={{ backgroundColor: '#f9fafb', fontWeight: 600, color: '#4b5563', padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>Amount (Store)</th>
              <th style={{ backgroundColor: '#f9fafb', fontWeight: 600, color: '#4b5563', padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>
                Payment Mode
                <select value={paymentModeFilter} onChange={e => setPaymentModeFilter(e.target.value)} style={{ display: 'block', width: '100%', marginTop: '4px', fontSize: '0.75rem', fontWeight: 'normal', padding: '2px', cursor: 'pointer' }}>
                  <option value="">All</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                </select>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map(sale => (
              <tr key={sale.sale_id}>
                <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', color: '#111827', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                  {new Date(sale.sale_date).toLocaleString()}
                </td>
                <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', color: '#111827', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                  {sale.product_code}
                </td>
                <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', color: '#111827', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                  <strong>₹{sale.sale_amount}</strong>
                </td>
                <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', color: '#111827', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '9999px', 
                    fontSize: '0.75rem', 
                    fontWeight: 500,
                    backgroundColor: sale.payment_mode === 'UPI' ? '#dbeafe' : '#dcfce3',
                    color: sale.payment_mode === 'UPI' ? '#1e40af' : '#166534'
                  }}>
                    {sale.payment_mode}
                  </span>
                </td>
              </tr>
            ))}
            {filteredSales.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
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
