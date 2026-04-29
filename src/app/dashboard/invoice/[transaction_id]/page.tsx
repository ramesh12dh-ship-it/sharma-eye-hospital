import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Image from 'next/image'
import InvoicePrintTrigger from './InvoicePrintTrigger'

type SaleRow = {
  sale_id: string
  sale_date: string
  product_code: string
  sale_amount: number
  tax_rate: number
  payment_mode: string
  order_status: string | null
  patients: {
    name: string
    phone: string
    address: string | null
  } | null
  products: {
    brands: string | null
    type: string | null
  } | null
}

export default async function InvoicePage({ params }: { params: { transaction_id: string } }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Step 1: fetch raw sales rows (no joins — isolate FK issues)
  const { data: sales, error } = await supabase
    .from('sales')
    .select('sale_id, sale_date, product_code, sale_amount, tax_rate, payment_mode, order_status, patient_id')
    .eq('transaction_id', params.transaction_id)
    .order('sale_date', { ascending: true })

  if (error) {
    console.error('[Invoice] Sales query error:', error)
    return (
      <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
        <h2 style={{ color: 'red' }}>Invoice Query Error</h2>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    )
  }

  if (!sales || sales.length === 0) {
    console.error('[Invoice] No sales found for transaction_id:', params.transaction_id)
    return (
      <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
        <h2 style={{ color: '#b45309' }}>No sales found</h2>
        <p>Transaction ID: <code>{params.transaction_id}</code></p>
        <p>This invoice either doesn&apos;t exist or you don&apos;t have access to it.</p>
      </div>
    )
  }

  // Step 2: fetch product info separately for each product_code
  const productCodes = [...new Set(sales.map(s => s.product_code))]
  const { data: products } = await supabase
    .from('products')
    .select('product_code, brands, type')
    .in('product_code', productCodes)
  const productMap = Object.fromEntries((products ?? []).map(p => [p.product_code, p]))

  // Step 3: fetch patient if any
  const patientId = sales[0].patient_id
  let patient: { name: string; phone: string; address: string | null } | null = null
  if (patientId) {
    const { data: pt } = await supabase
      .from('patients')
      .select('name, phone, address')
      .eq('patient_id', patientId)
      .single()
    patient = pt ?? null
  }

  const firstSale = sales[0]
  const saleDate = new Date(firstSale.sale_date)

  const subtotal = sales.reduce((sum, s) => sum + Number(s.sale_amount), 0)
  const totalTax = sales.reduce((sum, s) => sum + (Number(s.sale_amount) * (Number(s.tax_rate) / 100)), 0)
  const grandTotal = subtotal + totalTax

  const invoiceNumber = params.transaction_id.split('-')[0].toUpperCase()

  return (
    <>
      {/* Auto-print trigger (client component) */}
      <InvoicePrintTrigger />

      <div id="invoice-root" style={{ fontFamily: "'Arial', sans-serif", colorScheme: 'light', backgroundColor: 'white', color: '#000', maxWidth: '210mm', margin: '0 auto', padding: '12mm 14mm' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8mm', paddingBottom: '6mm', borderBottom: '2px solid #1e3a8a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Image src="/logo.png" alt="Sharma Eye Hospital" width={60} height={60} style={{ objectFit: 'contain' }} />
            <div>
              <div style={{ fontSize: '18pt', fontWeight: 'bold', color: '#1e3a8a', lineHeight: 1.1 }}>Sharma Eye Hospital</div>
              <div style={{ fontSize: '8pt', color: '#4b5563', marginTop: '2px' }}>Complete Eye Care Centre</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16pt', fontWeight: 'bold', color: '#1e3a8a' }}>INVOICE</div>
            <div style={{ fontSize: '8pt', color: '#4b5563', marginTop: '4px' }}>
              <div># {invoiceNumber}</div>
              <div>{saleDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
              <div>{saleDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        </div>

        {/* Patient + Payment Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6mm', marginBottom: '8mm' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '4mm', borderRadius: '3mm' }}>
            <div style={{ fontSize: '7pt', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Patient Details</div>
            {patient ? (
              <>
                <div style={{ fontSize: '11pt', fontWeight: 'bold' }}>{patient.name}</div>
                <div style={{ fontSize: '9pt', color: '#4b5563' }}>{patient.phone}</div>
                {patient.address && <div style={{ fontSize: '9pt', color: '#4b5563' }}>{patient.address}</div>}
              </>
            ) : (
              <div style={{ fontSize: '9pt', color: '#9ca3af', fontStyle: 'italic' }}>Walk-in / Guest</div>
            )}
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '4mm', borderRadius: '3mm' }}>
            <div style={{ fontSize: '7pt', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Payment Details</div>
            <div style={{ fontSize: '10pt' }}>Mode: <strong>{firstSale.payment_mode}</strong></div>
            <div style={{ fontSize: '10pt', marginTop: '2px' }}>
              Status: <strong style={{ color: firstSale.order_status === 'Instant Delivery' ? '#059669' : '#d97706' }}>
                {firstSale.order_status ?? 'Instant Delivery'}
              </strong>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6mm', fontSize: '9pt' }}>
          <thead>
            <tr style={{ backgroundColor: '#1e3a8a', color: 'white' }}>
              <th style={{ padding: '3mm 4mm', textAlign: 'left', fontWeight: 600 }}>#</th>
              <th style={{ padding: '3mm 4mm', textAlign: 'left', fontWeight: 600 }}>SKU / Product</th>
              <th style={{ padding: '3mm 4mm', textAlign: 'left', fontWeight: 600 }}>Brand / Type</th>
              <th style={{ padding: '3mm 4mm', textAlign: 'right', fontWeight: 600 }}>Amount</th>
              <th style={{ padding: '3mm 4mm', textAlign: 'right', fontWeight: 600 }}>Tax</th>
              <th style={{ padding: '3mm 4mm', textAlign: 'right', fontWeight: 600 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s, i) => {
              const taxAmt = Number(s.sale_amount) * (Number(s.tax_rate) / 100)
              const lineTotal = Number(s.sale_amount) + taxAmt
              const prod = productMap[s.product_code]
              return (
                <tr key={s.sale_id} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '3mm 4mm', color: '#6b7280' }}>{i + 1}</td>
                  <td style={{ padding: '3mm 4mm', fontWeight: 500 }}>{s.product_code}</td>
                  <td style={{ padding: '3mm 4mm', color: '#4b5563' }}>
                    {prod ? `${prod.brands ?? '—'} / ${prod.type ?? '—'}` : '—'}
                  </td>
                  <td style={{ padding: '3mm 4mm', textAlign: 'right' }}>₹{Number(s.sale_amount).toFixed(2)}</td>
                  <td style={{ padding: '3mm 4mm', textAlign: 'right', color: '#6b7280' }}>{s.tax_rate}% (₹{taxAmt.toFixed(2)})</td>
                  <td style={{ padding: '3mm 4mm', textAlign: 'right', fontWeight: 600 }}>₹{lineTotal.toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}>
          <div style={{ width: '60mm' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 0', fontSize: '9pt', borderTop: '1px solid #e5e7eb' }}>
              <span style={{ color: '#6b7280' }}>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2mm 0', fontSize: '9pt', borderBottom: '1px dashed #d1d5db' }}>
              <span style={{ color: '#6b7280' }}>Total Tax</span>
              <span>₹{totalTax.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3mm 0', fontSize: '12pt', fontWeight: 'bold', color: '#1e3a8a', borderBottom: '2px solid #1e3a8a' }}>
              <span>Grand Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '5mm', marginTop: '4mm' }}>
          <p style={{ fontSize: '9pt', color: '#4b5563', margin: '0 0 2mm' }}>
            Thank you for choosing Sharma Eye Hospital. Wishing you clear vision and good health!
          </p>
          <p style={{ fontSize: '7pt', color: '#9ca3af', margin: 0 }}>
            This is a computer-generated invoice and does not require a signature.
          </p>
        </div>

        {/* Print/Close buttons — hidden during print */}
        <div className="no-print" style={{ textAlign: 'center', marginTop: '8mm' }}>
          <a
            href="javascript:window.print()"
            style={{ display: 'inline-block', backgroundColor: '#1e3a8a', color: 'white', textDecoration: 'none', padding: '0.75rem 2rem', borderRadius: '0.375rem', fontSize: '1rem', fontWeight: 600, marginRight: '1rem' }}
          >
            🖨 Print Invoice
          </a>
          <a
            href="javascript:window.close()"
            style={{ display: 'inline-block', backgroundColor: '#6b7280', color: 'white', textDecoration: 'none', padding: '0.75rem 2rem', borderRadius: '0.375rem', fontSize: '1rem', fontWeight: 600 }}
          >
            Close
          </a>
        </div>
      </div>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: white; }
          @page {
            size: A4;
            margin: 0;
          }
        }
        @media screen {
          body { background: #f3f4f6; }
          #invoice-root {
            box-shadow: 0 4px 24px rgba(0,0,0,0.12);
            margin-top: 2rem;
            margin-bottom: 2rem;
            border-radius: 8px;
          }
        }
      `}</style>
    </>
  )
}
