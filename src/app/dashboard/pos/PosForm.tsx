'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import styles from './pos.module.css'

type ProductLite = {
  product_code: string
  stock: number
  sale_price_s: number | null
  type: string | null
  brands: string | null
}

export default function PosForm({ availableProducts, userId }: { availableProducts: ProductLite[], userId: string }) {
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI'>('Cash')
  const [saleAmount, setSaleAmount] = useState<number | ''>('')
  const [taxRate, setTaxRate] = useState<5 | 12>(5)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const supabase = createClient()

  const productDetails = availableProducts.find(p => p.product_code === selectedProduct)

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value
    setSelectedProduct(code)
    const p = availableProducts.find(p => p.product_code === code)
    if (p && p.sale_price_s) {
      setSaleAmount(p.sale_price_s)
    } else {
      setSaleAmount('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return
    if (saleAmount === '') return

    setIsSubmitting(true)
    setMessage(null)

    const { error } = await supabase.from('sales').insert([
      {
        product_code: selectedProduct,
        payment_mode: paymentMode,
        sale_amount: Number(saleAmount),
        tax_rate: taxRate,
        recorded_by: userId
      }
    ])

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Sale recorded successfully! Inventory has been updated.' })
      setSelectedProduct('')
      setSaleAmount('')
      setPaymentMode('Cash')
      setTaxRate(5)
    }
    
    setIsSubmitting(false)
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Select Product</label>
          <select 
            value={selectedProduct} 
            onChange={handleProductSelect}
            className={styles.select}
            required
          >
            <option value="">-- Choose a product --</option>
            {availableProducts.map(p => (
              <option key={p.product_code} value={p.product_code}>
                {p.product_code} ({p.brands} {p.type}) - Stock: {p.stock}
              </option>
            ))}
          </select>
          {productDetails && (
            <p className={styles.helperText}>
              Suggested Price: ₹{productDetails.sale_price_s || 'N/A'}
            </p>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Sale Amount (₹)</label>
          <input 
            type="number" 
            value={saleAmount} 
            onChange={e => setSaleAmount(e.target.value ? Number(e.target.value) : '')}
            className={styles.input}
            required
            min="0"
            step="0.01"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Payment Mode</label>
          <select 
            value={paymentMode} 
            onChange={e => setPaymentMode(e.target.value as 'Cash' | 'UPI')}
            className={styles.select}
          >
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Tax Rate (%)</label>
          <select 
            value={taxRate} 
            onChange={e => setTaxRate(Number(e.target.value) as 5 | 12)}
            className={styles.select}
          >
            <option value={5}>5%</option>
            <option value={12}>12%</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting || !selectedProduct} 
          className={styles.submitBtn}
        >
          {isSubmitting ? 'Recording...' : 'Record Sale'}
        </button>

        {message && (
          <div className={message.type === 'success' ? styles.successMsg : styles.errorMsg}>
            {message.text}
          </div>
        )}
      </form>
    </div>
  )
}
