"use client"

import React, { useState, useMemo } from 'react'
import styles from './reports.module.css'
import DeleteSaleButton from './DeleteSaleButton'

type Sale = {
  sale_id: string
  product_code: string
  sale_date: string
  payment_mode: string
  tax_rate: number
  recorded_by: string
  products: { sale_price_a: number | null } | null
}

export default function ReportsTable({ sales, role }: { sales: Sale[], role: string }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentModeFilter, setPaymentModeFilter] = useState('')
  const [taxRateFilter, setTaxRateFilter] = useState('')

  const getAccountPrice = (sale: Sale) => Number(sale.products?.sale_price_a || 0)

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchesSearch = !searchQuery || s.product_code.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPayment = !paymentModeFilter || s.payment_mode === paymentModeFilter
      const matchesTax = !taxRateFilter || String(s.tax_rate) === taxRateFilter
      return matchesSearch && matchesPayment && matchesTax
    })
  }, [sales, searchQuery, paymentModeFilter, taxRateFilter])

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
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

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Product Code (SKU)</th>
              <th>Amount (Accounts)</th>
              <th>
                Tax Rate
                <select value={taxRateFilter} onChange={e => setTaxRateFilter(e.target.value)} style={{ display: 'block', width: '100%', marginTop: '4px', fontSize: '0.75rem', fontWeight: 'normal', padding: '2px', cursor: 'pointer' }}>
                  <option value="">All</option>
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                </select>
              </th>
              <th>
                Payment Mode
                <select value={paymentModeFilter} onChange={e => setPaymentModeFilter(e.target.value)} style={{ display: 'block', width: '100%', marginTop: '4px', fontSize: '0.75rem', fontWeight: 'normal', padding: '2px', cursor: 'pointer' }}>
                  <option value="">All</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                </select>
              </th>
              {role === 'admin' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredSales.map(sale => (
              <tr key={sale.sale_id}>
                <td>{new Date(sale.sale_date).toLocaleString()}</td>
                <td>{sale.product_code}</td>
                <td><strong>₹{getAccountPrice(sale)}</strong></td>
                <td>{sale.tax_rate}%</td>
                <td>
                  <span className={`${styles.badge} ${sale.payment_mode === 'UPI' ? styles.badgeUpi : styles.badgeCash}`}>
                    {sale.payment_mode}
                  </span>
                </td>
                {role === 'admin' && (
                  <td>
                    <DeleteSaleButton saleId={sale.sale_id} />
                  </td>
                )}
              </tr>
            ))}
            {filteredSales.length === 0 && (
              <tr>
                <td colSpan={role === 'admin' ? 6 : 5} style={{ textAlign: 'center', padding: '2rem' }}>No sales found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
