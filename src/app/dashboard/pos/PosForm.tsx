'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Search, X, ShoppingCart, User, Package, CheckCircle2, AlertCircle } from 'lucide-react'
import { Input, Select, Textarea, Label } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

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

export default function PosForm({
  availableProducts, patients, userId,
}: { availableProducts: ProductLite[]; patients: PatientLite[]; userId: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI'>('Cash')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [patientActiveOrders, setPatientActiveOrders] = useState<
    { order_id: string; status: string; expected_date: string | null }[]
  >([])

  const [shouldCreateOrder, setShouldCreateOrder] = useState(false)
  const [expectedDate, setExpectedDate] = useState('')
  const [labNotes, setLabNotes] = useState('')

  const selectedPatient = patients.find(p => p.patient_id === selectedPatientId) ?? null

  // Fetch the patient's active optical orders so we can warn about duplicates
  useEffect(() => {
    if (!selectedPatientId) { setPatientActiveOrders([]); return }
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('optical_orders')
        .select('order_id, status, expected_date')
        .eq('patient_id', selectedPatientId)
        .not('status', 'in', '(delivered,cancelled)')
        .order('created_at', { ascending: false })
      if (cancelled) return
      if (error) {
        toast.error('Could not check existing orders', error.message)
        setPatientActiveOrders([])
      } else {
        setPatientActiveOrders(data ?? [])
      }
    })()
    return () => { cancelled = true }
  }, [selectedPatientId, supabase])

  const filteredPatients = useMemo(() => {
    if (!patientSearch) return []
    const q = patientSearch.toLowerCase()
    return patients
      .filter(p => p.name.toLowerCase().includes(q) || p.phone.includes(q))
      .slice(0, 6)
  }, [patients, patientSearch])

  useEffect(() => {
    const hasEyewear = cart.some(item => {
      const type = (item.product.type || '').toLowerCase()
      return type.includes('frame') || type.includes('lens')
    })
    if (hasEyewear && !shouldCreateOrder) {
      setShouldCreateOrder(true)
      const d = new Date()
      d.setDate(d.getDate() + 3)
      setExpectedDate(d.toISOString().split('T')[0])
    }
  }, [cart, shouldCreateOrder])

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return availableProducts.slice(0, 50)
    const q = searchQuery.toLowerCase()
    return availableProducts.filter(p =>
      p.product_code.toLowerCase().includes(q) ||
      (p.brands && p.brands.toLowerCase().includes(q)) ||
      (p.type && p.type.toLowerCase().includes(q)),
    ).slice(0, 100)
  }, [availableProducts, searchQuery])

  const handleSelectProduct = (product: ProductLite) => {
    if (cart.find(i => i.product.product_code === product.product_code)) return
    setCart([...cart, { product, saleAmount: product.sale_price_s || '', taxRate: 5 }])
  }
  const handleRemoveItem = (code: string) =>
    setCart(cart.filter(i => i.product.product_code !== code))
  const handleAmountChange = (code: string, newAmount: number | '') =>
    setCart(cart.map(i => (i.product.product_code === code ? { ...i, saleAmount: newAmount } : i)))
  const handleTaxRateChange = (code: string, newTaxRate: 5 | 12) =>
    setCart(cart.map(i => (i.product.product_code === code ? { ...i, taxRate: newTaxRate } : i)))

  const grandTotal = cart.reduce((s, i) => s + (Number(i.saleAmount) || 0), 0)
  const taxAmount = cart.reduce((s, i) => s + (Number(i.saleAmount) || 0) * (i.taxRate / 100), 0)
  const totalWithTax = grandTotal + taxAmount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) return
    if (cart.some(i => i.saleAmount === '')) return
    if (shouldCreateOrder && !selectedPatientId) {
      setMessage({ type: 'error', text: 'Please select a patient to create an optical order.' })
      return
    }

    setIsSubmitting(true)
    setMessage(null)
    const transactionId = crypto.randomUUID()

    const salesInserts = cart.map(item => ({
      product_code: item.product.product_code,
      payment_mode: paymentMode,
      sale_amount: Number(item.saleAmount),
      tax_rate: item.taxRate,
      recorded_by: userId,
      patient_id: selectedPatientId ?? null,
      transaction_id: transactionId,
    }))

    const { error: saleError } = await supabase.from('sales').insert(salesInserts)
    if (saleError) {
      setMessage({ type: 'error', text: saleError.message })
      toast.error('Could not record sale', saleError.message)
      setIsSubmitting(false)
      return
    }

    if (shouldCreateOrder && selectedPatientId) {
      const { error: orderError } = await supabase.from('optical_orders').insert({
        transaction_id: transactionId,
        patient_id: selectedPatientId,
        status: 'ordered',
        notes: labNotes,
        expected_date: expectedDate || null,
      })
      if (orderError) {
        setMessage({ type: 'success', text: 'Sale recorded, but order tracker failed to create.' })
      } else {
        setMessage({ type: 'success', text: 'Sale recorded & optical order created.' })
      }
    } else {
      setMessage({ type: 'success', text: 'Sale recorded.' })
    }

    setCart([])
    setSearchQuery('')
    setSelectedPatientId(null)
    setPatientSearch('')
    setPaymentMode('Cash')
    setShouldCreateOrder(false)
    setLabNotes('')
    router.refresh()
    setIsSubmitting(false)
  }

  return (
    // Bound the whole POS area to the viewport on lg+ so each pane scrolls
    // internally instead of the whole page growing tall.
    // (160px ≈ page header + padding above this grid.)
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:h-[calc(100dvh-160px)] lg:max-h-[860px]">
      {/* Left — product picker */}
      <div className="surface-card flex min-h-[400px] flex-col overflow-hidden lg:min-h-0">
        <div className="border-b border-hairline p-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <Input
              placeholder="Search by SKU, brand, or type…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {filteredProducts.length === 0 && (
            <div className="flex h-40 items-center justify-center text-[13px] text-ink-400">
              No products match your search.
            </div>
          )}
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {filteredProducts.map(p => {
              const isSelected = cart.some(i => i.product.product_code === p.product_code)
              return (
                <button
                  type="button"
                  key={p.product_code}
                  disabled={isSelected}
                  onClick={() => handleSelectProduct(p)}
                  className={cn(
                    'group flex items-center justify-between rounded-lg border border-transparent px-3 py-2.5 text-left transition-all',
                    isSelected
                      ? 'cursor-default opacity-60'
                      : 'hover:border-brand-200 hover:bg-brand-50/40',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-ink-900">
                      {p.product_code}
                      {isSelected && <CheckCircle2 size={12} className="text-accent-600" />}
                    </div>
                    <div className="truncate text-[11.5px] text-ink-500">
                      {p.brands || 'No brand'} · {p.type || 'No type'}
                    </div>
                  </div>
                  <div className="ml-3 text-right">
                    <div className="text-[13px] font-semibold text-ink-900">
                      ₹{p.sale_price_s ?? '—'}
                    </div>
                    <div className="mt-0.5">
                      {p.stock > 0
                        ? <Badge tone={p.stock <= 2 ? 'warn' : 'success'}>{p.stock} left</Badge>
                        : <Badge tone="danger">Out</Badge>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right — cart */}
      <div className="surface-card flex min-h-[400px] flex-col overflow-hidden lg:min-h-0">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <ShoppingCart size={16} strokeWidth={1.75} />
            </div>
            <h2 className="text-[15px] font-semibold tracking-tight text-ink-900">Cart</h2>
          </div>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
            {cart.length} item{cart.length === 1 ? '' : 's'}
          </span>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-ink-300 text-ink-400">
              <Package size={20} strokeWidth={1.5} />
            </div>
            <p className="text-[13px] text-ink-500">Pick products from the left to start.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            {/* Scrollable middle: patient + cart items + order tracker.
                The footer (total + payment + submit) stays anchored below. */}
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              {/* Patient selector */}
              <div>
                <Label className="mb-1.5 flex items-center gap-1.5">
                  <User size={12} /> Patient
                </Label>
                {selectedPatient ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-3 py-2">
                      <div>
                        <div className="text-[13.5px] font-semibold text-brand-800">{selectedPatient.name}</div>
                        <div className="text-[12px] text-brand-700/80 tabular">{selectedPatient.phone}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedPatientId(null); setPatientSearch('') }}
                        className="rounded-md p-1 text-brand-600 hover:bg-brand-100"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    {patientActiveOrders.length > 0 && (
                      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-700">
                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                        <span>
                          This patient already has{' '}
                          <strong>
                            {patientActiveOrders.length} active order{patientActiveOrders.length === 1 ? '' : 's'}
                          </strong>{' '}
                          ({patientActiveOrders.map(o => o.status.replace('_', ' ')).join(', ')}).
                          Confirm with them before creating another.
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      type="text"
                      value={patientSearch}
                      onChange={e => setPatientSearch(e.target.value)}
                      placeholder="Search by name or phone…"
                    />
                    {filteredPatients.length > 0 && (
                      <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-hairline bg-white shadow-[var(--shadow-lift)]">
                        {filteredPatients.map(p => (
                          <button
                            type="button"
                            key={p.patient_id}
                            onClick={() => { setSelectedPatientId(p.patient_id); setPatientSearch('') }}
                            className="flex w-full items-center justify-between border-b border-hairline px-3 py-2 text-left last:border-0 hover:bg-brand-50/60"
                          >
                            <span className="text-[13px] font-medium text-ink-900">{p.name}</span>
                            <span className="text-[12px] text-ink-500">{p.phone}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart items */}
              <div className="space-y-1">
                {cart.map((item, idx) => (
                  <div
                    key={item.product.product_code}
                    className="flex items-center gap-2 rounded-lg border border-hairline bg-white/60 px-2.5 py-2"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[10.5px] font-semibold text-ink-600">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-medium text-ink-900">
                        {item.product.product_code}
                      </div>
                      <div className="truncate text-[11px] text-ink-500">
                        {item.product.brands} · {item.product.type}
                      </div>
                    </div>
                    <Input
                      type="number"
                      value={item.saleAmount}
                      onChange={e => handleAmountChange(item.product.product_code, e.target.value ? Number(e.target.value) : '')}
                      className="h-7 w-20 px-2 text-[12px]"
                      aria-label="Sale amount"
                    />
                    <select
                      value={item.taxRate}
                      onChange={e =>
                        handleTaxRateChange(item.product.product_code, Number(e.target.value) as 5 | 12)
                      }
                      className="h-7 rounded-md border border-hairline bg-white px-1.5 text-[11.5px] text-ink-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
                      aria-label="Tax rate"
                    >
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.product.product_code)}
                      className="rounded-md p-1 text-ink-400 hover:bg-coral-50 hover:text-coral-600"
                      aria-label="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Order tracker block */}
              <div className="rounded-lg border border-hairline bg-ink-50/40 p-3.5">
                <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-ink-800">
                  <input
                    type="checkbox"
                    checked={shouldCreateOrder}
                    onChange={e => setShouldCreateOrder(e.target.checked)}
                    className="h-4 w-4 accent-brand-600"
                  />
                  Create optical order tracker
                </label>
                {shouldCreateOrder && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <Label>Expected delivery</Label>
                      <Input
                        type="date"
                        value={expectedDate}
                        onChange={e => setExpectedDate(e.target.value)}
                        className="mt-1"
                        required={shouldCreateOrder}
                      />
                    </div>
                    <div>
                      <Label>Workshop notes</Label>
                      <Textarea
                        value={labNotes}
                        onChange={e => setLabNotes(e.target.value)}
                        placeholder="e.g. AR Coating, Crizal lens, fitting notes…"
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 border-t border-hairline bg-white/40 p-5">
              <div className="mb-3 flex items-baseline justify-between border-b border-dashed border-hairline pb-3">
                <span className="text-[13px] font-medium text-ink-600">Total</span>
                <span className="tabular text-[20px] font-semibold tracking-tight text-ink-900">
                  ₹{totalWithTax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="mb-3">
                <Label>Payment</Label>
                <Select
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value as 'Cash' | 'UPI')}
                  className="mt-1"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                </Select>
              </div>

              <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
                {isSubmitting ? 'Processing…' : 'Confirm sale & print invoice'}
              </Button>

              {message && (
                <div
                  className={cn(
                    'mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-[12.5px]',
                    message.type === 'success'
                      ? 'border-accent-200 bg-accent-50 text-accent-700'
                      : 'border-coral-200 bg-coral-50 text-coral-700',
                  )}
                >
                  {message.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  <span>{message.text}</span>
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
