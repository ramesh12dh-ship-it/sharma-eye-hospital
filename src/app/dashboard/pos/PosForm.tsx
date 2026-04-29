'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import styles from './pos.module.css'

type ProductLite = {
  product_code: string
  stock: number
  sale_price_s: number | null
  type: string | null
  brands: string | null
}

type PatientLite = {
  patient_id: string
  name: string
  phone: string
}

type CartItem = {
  product: ProductLite
  saleAmount: number | ''
  taxRate: 5 | 12
}

export default function PosForm({ availableProducts, patients, userId }: { availableProducts: ProductLite[], patients: PatientLite[], userId: string }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI'>('Cash')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  // Patient state
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

  const selectedPatient = patients.find(p => p.patient_id === selectedPatientId) ?? null

  // Today's patients — shown as quick-pick chips
  const todaysPatients = useMemo(() => {
    const today = new Date().toDateString()
    return patients.filter(p => new Date(p.created_at).toDateString() === today)
  }, [patients])

  const filteredPatients = useMemo(() => {
    if (!patientSearch) return []
    const q = patientSearch.toLowerCase()
    return patients.filter(p =>
      p.name.toLowerCase().includes(q) || p.phone.includes(q)
    ).slice(0, 6)
  }, [patients, patientSearch])

  const supabase = createClient()

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return availableProducts.slice(0, 50)
    const q = searchQuery.toLowerCase()
    return availableProducts.filter(p => 
      p.product_code.toLowerCase().includes(q) || 
      (p.brands && p.brands.toLowerCase().includes(q)) ||
      (p.type && p.type.toLowerCase().includes(q))
    ).slice(0, 100)
  }, [availableProducts, searchQuery])

  const handleSelectProduct = (product: ProductLite) => {
    // Prevent adding duplicates to the cart
    if (cart.find(item => item.product.product_code === product.product_code)) {
      return
    }
    
    setCart([...cart, {
      product,
      saleAmount: product.sale_price_s || '',
      taxRate: 5 // Default tax rate
    }])
  }

  const handleRemoveItem = (product_code: string) => {
    setCart(cart.filter(item => item.product.product_code !== product_code))
  }

  const handleAmountChange = (product_code: string, newAmount: number | '') => {
    setCart(cart.map(item => 
      item.product.product_code === product_code 
        ? { ...item, saleAmount: newAmount } 
        : item
    ))
  }

  const handleTaxRateChange = (product_code: string, newTaxRate: 5 | 12) => {
    setCart(cart.map(item => 
      item.product.product_code === product_code 
        ? { ...item, taxRate: newTaxRate } 
        : item
    ))
  }

  const grandTotal = cart.reduce((sum, item) => sum + (Number(item.saleAmount) || 0), 0)
  const taxAmount = cart.reduce((sum, item) => sum + ((Number(item.saleAmount) || 0) * (item.taxRate / 100)), 0)
  const totalWithTax = grandTotal + taxAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) return
    if (cart.some(item => item.saleAmount === '')) return

    setIsSubmitting(true)
    setMessage(null)

    const inserts = cart.map(item => ({
      product_code: item.product.product_code,
      payment_mode: paymentMode,
      sale_amount: Number(item.saleAmount),
      tax_rate: item.taxRate,
      recorded_by: userId,
      patient_id: selectedPatientId ?? null,
    }))

    const { error } = await supabase.from('sales').insert(inserts)

    if (error) {
      if (error.message.includes('violates row-level security')) {
        setMessage({ type: 'error', text: 'You do not have permission to record a sale.' })
      } else {
        setMessage({ type: 'error', text: 'Could not record sale. Please try again.' })
      }
    } else {
      setMessage({ type: 'success', text: `Sale recorded for ${cart.length} item(s)! Inventory updated.` })
      setCart([])
      setSearchQuery('')
      setSelectedPatientId(null)
      setPatientSearch('')
      setPaymentMode('Cash')
      router.refresh()
    }
    
    setIsSubmitting(false)
  }

  return (
    <div className={styles.splitContainer}>
      {/* LEFT PANE: Search & Select */}
      <div className={styles.leftPane}>
        <div className={styles.searchHeader}>
          <input 
            type="text" 
            placeholder="Search by SKU, Brand, or Type..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={styles.input}
            style={{ width: '100%' }}
            autoFocus
          />
        </div>
        <div className={styles.productList}>
          {filteredProducts.map(p => {
            const isSelected = cart.some(item => item.product.product_code === p.product_code)
            return (
              <div 
                key={p.product_code} 
                className={`${styles.productCard} ${isSelected ? styles.selected : ''}`}
                onClick={() => !isSelected && handleSelectProduct(p)}
                style={{ cursor: isSelected ? 'default' : 'pointer', opacity: isSelected ? 0.7 : 1 }}
              >
                <div className={styles.productInfo}>
                  <span className={styles.productSku}>
                    {p.product_code} {isSelected && '✓'}
                  </span>
                  <span className={styles.productDetails}>{p.brands || 'No Brand'} • {p.type || 'No Type'}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={styles.productPrice}>₹{p.sale_price_s || 'N/A'}</div>
                  <div className={`${styles.productStock} ${p.stock > 0 ? styles.stockIn : styles.stockOut}`}>
                    {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                  </div>
                </div>
              </div>
            )
          })}
          {filteredProducts.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
              No products found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANE: Checkout Cart */}
      <div className={styles.rightPane}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0 }}>
            Shopping Cart
          </h2>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2563eb', backgroundColor: '#dbeafe', padding: '0.25rem 0.5rem', borderRadius: '9999px' }}>
            {cart.length} item(s)
          </span>
        </div>
        
        {cart.length > 0 ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Patient Selector */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', display: 'block', marginBottom: '0.5rem' }}>Patient (optional)</label>
              {selectedPatient ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.75rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.375rem' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#1d4ed8' }}>{selectedPatient.name}</span>
                    <span style={{ marginLeft: '0.5rem', color: '#4b5563', fontSize: '0.875rem' }}>{selectedPatient.phone}</span>
                  </div>
                  <button type="button" onClick={() => { setSelectedPatientId(null); setPatientSearch('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontWeight: 'bold' }}>&times;</button>
                </div>
              ) : (
                <div>
                  {/* Today's patients as quick-pick chips */}
                  {todaysPatients.length > 0 && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today's Patients</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {todaysPatients.map(p => (
                          <button
                            key={p.patient_id}
                            type="button"
                            onClick={() => setSelectedPatientId(p.patient_id)}
                            style={{ padding: '0.25rem 0.625rem', borderRadius: '9999px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Search for older patients */}
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={e => setPatientSearch(e.target.value)}
                      placeholder={todaysPatients.length > 0 ? 'Or search older patients...' : 'Search by name or phone...'}
                      className={styles.input}
                      style={{ width: '100%' }}
                    />
                    {filteredPatients.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 10 }}>
                        {filteredPatients.map(p => (
                          <div
                            key={p.patient_id}
                            onClick={() => { setSelectedPatientId(p.patient_id); setPatientSearch('') }}
                            style={{ padding: '0.625rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}
                          >
                            <span style={{ fontWeight: 500 }}>{p.name}</span>
                            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{p.phone}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {patientSearch && filteredPatients.length === 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.625rem 0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        No patient found — <a href="/dashboard/patients" target="_blank" style={{ color: '#2563eb' }}>Add them here</a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem', paddingRight: '0.5rem' }}>
              {cart.map((item, index) => (
                <div key={item.product.product_code} className={styles.cartItem}>
                  <div className={styles.cartItemDetails}>
                    <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>
                      {index + 1}. {item.product.product_code}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {item.product.brands} • {item.product.type}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#6b7280' }}>₹</span>
                    <input 
                      type="number" 
                      value={item.saleAmount} 
                      onChange={e => handleAmountChange(item.product.product_code, e.target.value ? Number(e.target.value) : '')}
                      className={styles.input}
                      style={{ width: '80px', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                      required
                      min="0"
                      step="0.01"
                      title="Item Price"
                    />
                    <select 
                      value={item.taxRate} 
                      onChange={e => handleTaxRateChange(item.product.product_code, Number(e.target.value) as 5 | 12)}
                      className={styles.select}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                      title="Item Tax Rate"
                    >
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                    </select>
                    <button 
                      type="button" 
                      className={styles.removeBtn}
                      onClick={() => handleRemoveItem(item.product.product_code)}
                      title="Remove Item"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '2px dashed #e5e7eb', paddingTop: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#4b5563' }}>
                <span>Subtotal:</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#4b5563' }}>
                <span>Total Tax:</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginTop: '0.5rem' }}>
                <span>Grand Total:</span>
                <span>₹{totalWithTax.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
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
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || cart.some(i => i.saleAmount === '')} 
              className={styles.submitBtn}
            >
              {isSubmitting ? 'Processing...' : `Confirm Sale (₹${totalWithTax.toFixed(2)})`}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', border: '2px dashed #d1d5db', borderRadius: '0.5rem', color: '#6b7280' }}>
            <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛒</span>
            <p>Your cart is empty. Click products to add them.</p>
          </div>
        )}

        {message && (
          <div className={message.type === 'success' ? styles.successMsg : styles.errorMsg}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  )
}
