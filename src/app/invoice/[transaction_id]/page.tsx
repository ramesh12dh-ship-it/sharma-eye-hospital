import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { Printer, X } from 'lucide-react'
import InvoicePrintTrigger from './InvoicePrintTrigger'

export default async function InvoicePage({ params }: { params: Promise<{ transaction_id: string }> }) {
  const { transaction_id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sales, error } = await supabase
    .from('sales')
    .select('sale_id, sale_date, product_code, sale_amount, tax_rate, payment_mode, order_status, patient_id')
    .eq('transaction_id', transaction_id)
    .order('sale_date', { ascending: true })

  if (error) {
    return (
      <div className="p-8 font-mono text-sm">
        <h2 className="text-coral-600">Invoice query error</h2>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
    )
  }

  if (!sales || sales.length === 0) {
    return (
      <div className="p-8 font-mono text-sm">
        <h2 className="text-amber-700">No sales found</h2>
        <p>Transaction ID: <code>{transaction_id}</code></p>
        <p>This invoice does not exist or you do not have access.</p>
      </div>
    )
  }

  const productCodes = [...new Set(sales.map(s => s.product_code))]
  const { data: products } = await supabase
    .from('products')
    .select('product_code, brands, type')
    .in('product_code', productCodes)
  const productMap = Object.fromEntries((products ?? []).map(p => [p.product_code, p]))

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
  const subtotal = sales.reduce((s, x) => s + Number(x.sale_amount), 0)
  const totalTax = sales.reduce((s, x) => s + Number(x.sale_amount) * (Number(x.tax_rate) / 100), 0)
  const grandTotal = subtotal + totalTax
  const invoiceNumber = transaction_id.split('-')[0].toUpperCase()

  return (
    <>
      <InvoicePrintTrigger />

      {/* Standalone route — no dashboard chrome, renders edge-to-edge. */}
      <div className="invoice-shell min-h-dvh bg-ink-100 print:bg-white">
        <div className="invoice-page mx-auto bg-white text-ink-900 shadow-[var(--shadow-lift)] print:shadow-none">
          {/* Header */}
          <header className="relative flex items-start justify-between border-b-2 border-brand-700 px-12 pt-10 pb-6 print:px-0">
            <div className="flex items-center gap-4">
              <Image src="/logo.png" alt="Sharma Eye Hospital" width={64} height={64} className="object-contain" />
              <div>
                <div className="text-[20pt] font-semibold tracking-tight text-brand-700">Sharma Eye Hospital</div>
                <div className="mt-0.5 text-[9pt] uppercase tracking-[0.16em] text-ink-500">
                  Complete eye care · Vision with care
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[16pt] font-semibold tracking-[0.06em] text-brand-700">INVOICE</div>
              <div className="mt-2 space-y-0.5 text-[9pt] tabular text-ink-600">
                <div className="font-mono text-ink-800">#{invoiceNumber}</div>
                <div>{saleDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                <div>{saleDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          </header>

          {/* Patient + Payment */}
          <section className="grid grid-cols-2 gap-5 px-12 py-6 print:px-0">
            <InfoBlock label="Billed to">
              {patient ? (
                <>
                  <div className="text-[12pt] font-semibold text-ink-900">{patient.name}</div>
                  <div className="mt-0.5 text-[10pt] tabular text-ink-600">{patient.phone}</div>
                  {patient.address && (
                    <div className="mt-0.5 text-[10pt] text-ink-600">{patient.address}</div>
                  )}
                </>
              ) : (
                <div className="text-[10pt] italic text-ink-400">Walk-in / Guest</div>
              )}
            </InfoBlock>
            <InfoBlock label="Payment">
              <div className="text-[10.5pt]">
                Mode: <strong className="text-ink-900">{firstSale.payment_mode}</strong>
              </div>
              <div className="mt-0.5 text-[10.5pt]">
                Status:{' '}
                <strong className={
                  firstSale.order_status === 'Instant Delivery'
                    ? 'text-accent-700'
                    : 'text-amber-700'
                }>
                  {firstSale.order_status ?? 'Instant Delivery'}
                </strong>
              </div>
            </InfoBlock>
          </section>

          {/* Items */}
          <section className="px-12 print:px-0">
            <table className="w-full border-collapse text-[10pt] tabular">
              <thead>
                <tr className="bg-brand-700 text-white">
                  <th className="px-3 py-2.5 text-left font-semibold">#</th>
                  <th className="px-3 py-2.5 text-left font-semibold">SKU / Product</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Brand / Type</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Amount</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Tax</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s, i) => {
                  const taxAmt = Number(s.sale_amount) * (Number(s.tax_rate) / 100)
                  const lineTotal = Number(s.sale_amount) + taxAmt
                  const prod = productMap[s.product_code]
                  return (
                    <tr key={s.sale_id} className="border-b border-hairline">
                      <td className="px-3 py-2.5 text-ink-500">{i + 1}</td>
                      <td className="px-3 py-2.5 font-medium text-ink-900">{s.product_code}</td>
                      <td className="px-3 py-2.5 text-ink-600">
                        {prod ? `${prod.brands ?? '—'} · ${prod.type ?? '—'}` : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right text-ink-800">
                        ₹{Number(s.sale_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2.5 text-right text-ink-500">
                        {s.tax_rate}% <span className="text-ink-400">(₹{taxAmt.toFixed(2)})</span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-ink-900">
                        ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>

          {/* Totals */}
          <section className="flex justify-end px-12 py-6 print:px-0">
            <div className="w-[280px]">
              <div className="flex items-center justify-between border-t border-hairline py-2 text-[10pt]">
                <span className="text-ink-500">Subtotal</span>
                <span className="tabular text-ink-800">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between border-b border-dashed border-hairline py-2 text-[10pt]">
                <span className="text-ink-500">Total tax</span>
                <span className="tabular text-ink-800">₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="mt-1 flex items-center justify-between border-b-2 border-brand-700 py-3">
                <span className="text-[11pt] font-semibold text-brand-800">Grand total</span>
                <span className="tabular text-[14pt] font-semibold text-brand-800">
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-hairline px-12 py-6 text-center print:px-0">
            <p className="text-[10pt] text-ink-600">
              Thank you for choosing Sharma Eye Hospital. Wishing you clear vision and good health.
            </p>
            <p className="mt-1.5 text-[8pt] tracking-wide text-ink-400">
              Computer-generated invoice · No signature required
            </p>
          </footer>

          {/* Watermark spiral, faint, behind everything */}
          <div
            aria-hidden
            className="watermark pointer-events-none absolute right-[-100px] bottom-[-100px] h-[400px] w-[400px] print:opacity-[0.025]"
          />

          {/* Action bar — screen only */}
          <div className="no-print flex items-center justify-end gap-2 border-t border-hairline bg-ink-50/50 px-12 py-4 print:hidden">
            <a
              href="javascript:window.close()"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-hairline bg-white px-3.5 text-[13px] font-medium text-ink-700 hover:bg-ink-100"
            >
              <X size={14} /> Close
            </a>
            <a
              href="javascript:window.print()"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 text-[13px] font-medium text-white shadow-sm hover:bg-brand-700"
            >
              <Printer size={14} /> Print
            </a>
          </div>
        </div>
      </div>

      <style>{`
        .invoice-page {
          position: relative;
          width: 210mm;
          min-height: 297mm;
          margin-block: 24px;
        }
        @media print {
          .invoice-shell { background: white !important; }
          .invoice-page {
            margin: 0;
            box-shadow: none;
            width: 100%;
            min-height: 100vh;
          }
          @page { size: A4; margin: 12mm 14mm; }
        }
      `}</style>
    </>
  )
}

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-hairline bg-ink-50/50 p-4">
      <div className="mb-1.5 text-[8pt] font-semibold uppercase tracking-[0.14em] text-ink-500">
        {label}
      </div>
      <div className="space-y-0">{children}</div>
    </div>
  )
}
