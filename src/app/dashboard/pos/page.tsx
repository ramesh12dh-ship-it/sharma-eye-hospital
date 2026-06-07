import { getAuthUser, getUserRoles, createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PosForm from './PosForm'
import PosRecentSalesTable from './PosRecentSalesTable'
import { hasRole } from '@/utils/roles'
import { PageHeader } from '@/components/ui/PageHeader'
import { AccessDenied } from '@/components/ui/AccessDenied'

export default async function PosPage() {
  const [user, userRoles, supabase] = await Promise.all([getAuthUser(), getUserRoles(), createClient()])
  if (!user) redirect('/login')

  if (!hasRole(userRoles, 'store_manager') && !hasRole(userRoles, 'receptionist')) {
    return <AccessDenied resource="Point of Sale" />
  }

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [productsRes, recentSalesRes, patientsRes] = await Promise.all([
    supabase.from('products').select('product_code, stock, mrp, type, brands').gt('stock', 0),
    supabase.from('sales')
      .select('sale_id, product_code, sale_date, payment_mode, sale_amount, tax_rate, transaction_id, is_voided')
      .gte('sale_date', sevenDaysAgo.toISOString())
      .order('sale_date', { ascending: false })
      .limit(20),
    supabase.from('patients').select('patient_id, name, phone').order('name', { ascending: true }),
  ])

  const products = productsRes.data
  const recentSales = recentSalesRes.data
  const patients = patientsRes.data

  const transactionIds = recentSales?.map(s => s.transaction_id).filter(Boolean) || []
  const { data: orders } = await supabase
    .from('optical_orders')
    .select('transaction_id, status')
    .in('transaction_id', transactionIds)

  const recentSalesKey = (recentSales ?? [])
    .map(s => `${s.sale_id}:${s.sale_amount}:${s.is_voided}`)
    .join('|')

  return (
    <div>
      <PageHeader
        title="Opticals"
        description="Pick products, attach a patient, and record the sale."
      />
      <PosForm
        availableProducts={products || []}
        patients={patients || []}
        userId={user.id}
      />
      <PosRecentSalesTable
        key={recentSalesKey}
        sales={recentSales || []}
        orders={orders || []}
        canEdit={hasRole(userRoles, 'store_manager')}
      />
    </div>
  )
}
