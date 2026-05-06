import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { roleLabel } from '@/utils/roles'
import { ArrowUpRight, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Watermark } from '@/components/brand/Watermark'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const userRoles = roleData?.map(r => r.role) ?? []
  const rolesDisplay = userRoles.map(roleLabel).join(' · ')

  // ─── Today / actionable signals ──────────────────────────────────────
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const localToday = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()

  const [
    todaySalesRes,
    pendingOrdersRes,
    readyOrdersRes,
    overdueOrdersRes,
    missingMrpRes,
    missingPriceSRes,
  ] = await Promise.all([
    supabase
      .from('sales')
      .select('sale_amount')
      .gte('sale_date', today.toISOString())
      .eq('is_voided', false),
    supabase
      .from('optical_orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['ordered', 'in_workshop']),
    supabase
      .from('optical_orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ready'),
    supabase
      .from('optical_orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['ordered', 'in_workshop'])
      .lt('expected_date', localToday),
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .is('mrp', null),
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .is('sale_price_s', null),
  ])

  const todaySales = todaySalesRes.data ?? []
  const totalToday = todaySales.reduce((acc, s) => acc + Number(s.sale_amount), 0)
  const pendingOrders = pendingOrdersRes.count ?? 0
  const readyOrders = readyOrdersRes.count ?? 0
  const overdueOrders = overdueOrdersRes.count ?? 0
  const missingMrp = missingMrpRes.count ?? 0
  const missingPriceS = missingPriceSRes.count ?? 0
  const showCleanup = userRoles.includes('admin') || userRoles.includes('store_manager')

  // Pick the most pressing cleanup signal: missing sale price (can't sell)
  // takes priority over missing MRP (just billing detail).
  const cleanupValue = missingPriceS > 0 ? missingPriceS : missingMrp
  const cleanupLabel = missingPriceS > 0 ? 'Missing sale price' : 'Missing MRP'
  const cleanupHref = missingPriceS > 0
    ? '/dashboard/inventory?sale_s=missing'
    : '/dashboard/inventory?mrp=missing'
  const cleanupHint = missingPriceS > 0
    ? 'Products that can’t be rung up'
    : missingMrp > 0
      ? 'Invoices will look incomplete'
      : 'Catalogue is clean'

  return (
    <div className="relative space-y-8">
      {/* Watermark — only on this hero/home page, not on data pages */}
      <Watermark
        size={680}
        className="fixed -right-40 top-20 hidden lg:block"
        opacity={0.04}
      />

      {/* Greeting */}
      <header className="relative">
        <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-ink-400">
          {today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="mt-1.5 text-[32px] font-semibold tracking-tight text-ink-900 sm:text-[36px]">
          Welcome to Sharma Eye Hospital
        </h1>
        <p className="mt-1.5 text-[15px] text-ink-500">
          Signed in as <span className="font-medium text-ink-700">{rolesDisplay || 'Staff'}</span>
        </p>
      </header>

      {/* Today's signals — actionable, deduped from sidebar nav */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SignalCard
          label="Billed today"
          value={`₹${totalToday.toLocaleString('en-IN')}`}
          hint={`${todaySales.length} item${todaySales.length === 1 ? '' : 's'} sold today`}
          tone="brand"
        />
        <SignalCard
          label="Ready for pickup"
          value={String(readyOrders)}
          hint={readyOrders > 0 ? 'Customers can collect today' : 'Nothing ready right now'}
          tone={readyOrders > 0 ? 'success' : 'neutral'}
          href="/dashboard/orders?status=ready"
        />
        <SignalCard
          label="Pending workshop"
          value={String(pendingOrders)}
          hint={
            overdueOrders > 0
              ? `${overdueOrders} overdue`
              : pendingOrders > 0 ? 'In progress or queued' : 'Workshop is clear'
          }
          tone={overdueOrders > 0 ? 'warn' : pendingOrders > 0 ? 'brand' : 'neutral'}
          href="/dashboard/orders"
          warnIcon={overdueOrders > 0}
        />
        {showCleanup && (
          <SignalCard
            label={cleanupLabel}
            value={String(cleanupValue)}
            hint={cleanupHint}
            tone={cleanupValue > 0 ? 'warn' : 'neutral'}
            href={cleanupValue > 0 ? cleanupHref : undefined}
          />
        )}
      </div>
    </div>
  )
}

function SignalCard({
  label, value, hint, tone, href, warnIcon,
}: {
  label: string
  value: string
  hint: string
  tone: 'brand' | 'success' | 'warn' | 'neutral'
  href?: string
  warnIcon?: boolean
}) {
  const toneStyles = {
    brand:   { eyebrow: 'text-brand-700',   value: 'text-brand-800',   hint: 'text-brand-600/80',   bg: 'bg-brand-50/60',   border: 'border-brand-200/60' },
    success: { eyebrow: 'text-accent-700',  value: 'text-accent-700',  hint: 'text-accent-600/80',  bg: 'bg-accent-50/60',  border: 'border-accent-200/60' },
    warn:    { eyebrow: 'text-amber-700',   value: 'text-amber-700',   hint: 'text-amber-700/80',   bg: 'bg-amber-50',      border: 'border-amber-200' },
    neutral: { eyebrow: 'text-ink-600',     value: 'text-ink-900',     hint: 'text-ink-500',        bg: 'bg-white',         border: 'border-hairline' },
  }[tone]

  const card = (
    <Card className={`${toneStyles.bg} ${toneStyles.border} group relative p-5 transition-all ${href ? 'hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]' : ''}`}>
      <div className="flex items-center justify-between">
        <div className={`text-[11.5px] font-semibold uppercase tracking-[0.14em] ${toneStyles.eyebrow}`}>
          {label}
        </div>
        {href && (
          <ArrowUpRight
            size={15}
            strokeWidth={1.75}
            className={`${toneStyles.eyebrow} opacity-0 transition-opacity group-hover:opacity-100`}
          />
        )}
      </div>
      <div className={`mt-2 flex items-baseline gap-2 tabular text-[30px] font-semibold tracking-tight ${toneStyles.value}`}>
        {warnIcon && <AlertTriangle size={20} className="text-amber-600" strokeWidth={2} />}
        {value}
      </div>
      <div className={`mt-1 text-[13px] ${toneStyles.hint}`}>{hint}</div>
    </Card>
  )

  if (href) return <Link href={href} className="block">{card}</Link>
  return card
}
