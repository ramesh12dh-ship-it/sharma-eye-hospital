import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PosForm from './PosForm'
import PosRecentSalesTable from './PosRecentSalesTable'
import { hasRole } from '@/utils/roles'
import { PageHeader } from '@/components/ui/PageHeader'
import { AccessDenied } from '@/components/ui/AccessDenied'

export default async function PosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const userRoles = roleData?.map(r => r.role) ?? []

  if (!hasRole(userRoles, 'store_manager') && !hasRole(userRoles, 'receptionist')) {
    return <AccessDenied resource="Point of Sale" />
  }

  const { data: products } = await supabase
    .from('products')
    .select('product_code, stock, sale_price_s, type, brands')
    .gt('stock', 0)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { data: recentSales } = await supabase
    .from('sales')
    .select('sale_id, product_code, sale_date, payment_mode, sale_amount, tax_rate, transaction_id, is_voided')
    .gte('sale_date', sevenDaysAgo.toISOString())
    .order('sale_date', { ascending: false })
    .limit(20)

  const { data: patients } = await supabase
    .from('patients')
    .select('patient_id, name, phone')
    .order('name', { ascending: true })

  const transactionIds = recentSales?.map(s => s.transaction_id).filter(Boolean) || []
  const { data: orders } = await supabase
    .from('optical_orders')
    .select('transaction_id, status')
    .in('transaction_id', transactionIds)

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
        sales={recentSales || []}
        orders={orders || []}
        canEdit={hasRole(userRoles, 'store_manager')}
      />
    </div>
  )
}
