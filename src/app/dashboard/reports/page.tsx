import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ExportButton from './ExportButton'
import ReportsTable from './ReportsTable'
import { hasRole } from '@/utils/roles'
import { PageHeader } from '@/components/ui/PageHeader'
import { AccessDenied } from '@/components/ui/AccessDenied'
import { Card } from '@/components/ui/Card'

type SearchParams = {
  range?: string  // "YYYY-MM-DD..YYYY-MM-DD" — drives server query
}

function parseRange(range?: string): { from: Date; to: Date; label: string } {
  const now = new Date()
  if (range) {
    const [fromStr, toStr] = range.split('..')
    const from = fromStr ? new Date(`${fromStr}T00:00:00`) : (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d })()
    const to = toStr ? new Date(`${toStr}T23:59:59`) : now
    return { from, to, label: `${formatLabel(from)} – ${formatLabel(to)}` }
  }
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return { from, to: now, label: 'Last 30 days' }
}

const formatLabel = (d: Date) =>
  d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

export default async function ReportsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const userRoles = roleData?.map(r => r.role) ?? []
  const role = userRoles.includes('admin') ? 'admin' : (userRoles[0] ?? '')

  if (!hasRole(userRoles, 'accountant')) {
    return <AccessDenied resource="Financial Reports" />
  }

  const params = await searchParams
  const { from, to, label } = parseRange(params.range)

  const { data: sales, error } = await supabase
    .from('sales')
    .select(`
      sale_id, product_code, sale_date, payment_mode, tax_rate, sale_amount,
      is_voided, patient_id, recorded_by,
      products ( sale_price_a ),
      patients ( name, phone )
    `)
    .gte('sale_date', from.toISOString())
    .lte('sale_date', to.toISOString())
    .order('sale_date', { ascending: false })

  if (error) console.error('Error fetching sales:', error)

  const getAccountPrice = (sale: any) => Number(sale.products?.sale_price_a || 0)
  const live = (sales ?? []).filter(s => !s.is_voided)
  const totalSales = live.reduce((acc, s) => acc + getAccountPrice(s), 0)
  const totalTax = live.reduce((acc, s) => acc + (getAccountPrice(s) * Number(s.tax_rate)) / 100, 0)

  const exportData = (sales ?? []).map(sale => ({
    Date: new Date(sale.sale_date).toLocaleString(),
    'Product Code': sale.product_code,
    Patient: (sale as any).patients?.name ?? '',
    'Phone': (sale as any).patients?.phone ?? '',
    'Payment Mode': sale.payment_mode,
    'Tax Rate (%)': sale.tax_rate,
    'Amount (Accounts)': getAccountPrice(sale),
    Voided: sale.is_voided ? 'Yes' : 'No',
  }))

  return (
    <div>
      <PageHeader
        title="Financial Reports"
        description={`${label} · revenue, tax collected, and transaction log.`}
        actions={<ExportButton data={exportData} filename={`reports_${label.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`} />}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Revenue" value={totalSales} accent rangeLabel={label} />
        <StatCard label="Tax collected" value={totalTax} rangeLabel={label} />
        <StatCard label="Transactions" value={live.length} count rangeLabel={label} />
      </div>

      <Suspense fallback={null}>
        {/* Supabase's TS inference returns joined relations as arrays even
            when the FK is many-to-one. Runtime is the single-object shape
            that ReportsTable expects, so cast through `unknown`. */}
        <ReportsTable sales={(sales ?? []) as any} role={role} rangeLabel={label} />
      </Suspense>
    </div>
  )
}

function StatCard({
  label, value, accent, count, rangeLabel,
}: { label: string; value: number; accent?: boolean; count?: boolean; rangeLabel: string }) {
  return (
    <Card className="p-5">
      <div className="text-[11.5px] font-medium uppercase tracking-[0.14em] text-ink-400">
        {label}
      </div>
      <div className={`mt-2 tabular text-[28px] font-semibold tracking-tight ${accent ? 'text-brand-700' : 'text-ink-900'}`}>
        {count
          ? value.toLocaleString('en-IN')
          : `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
      </div>
      <div className="mt-1 text-[11.5px] text-ink-400">{rangeLabel}</div>
    </Card>
  )
}
