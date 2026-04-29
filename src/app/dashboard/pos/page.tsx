import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PosForm from './PosForm'
import PosRecentSalesTable from './PosRecentSalesTable'

import { hasRole } from '@/utils/roles'

export default async function PosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const userRoles = roleData?.map(r => r.role) ?? []

  if (!hasRole(userRoles, 'store_manager') && !hasRole(userRoles, 'receptionist')) {
    return (
      <div>
        <h1 style={{ color: 'red', fontSize: '1.5rem', fontWeight: 'bold' }}>Access Denied</h1>
        <p>You do not have permission to view the Point of Sale.</p>
      </div>
    )
  }

  // Fetch available products
  const { data: products } = await supabase
    .from('products')
    .select('product_code, stock, sale_price_s, type, brands')
    .gt('stock', 0) // Only show items in stock

  // Fetch recent sales (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { data: recentSales } = await supabase
    .from('sales')
    .select('sale_id, product_code, sale_date, payment_mode, sale_amount, tax_rate, transaction_id, is_voided')
    .gte('sale_date', sevenDaysAgo.toISOString())
    .order('sale_date', { ascending: false })
    .limit(20)

  // Fetch patients for the patient selector
  const { data: patients } = await supabase
    .from('patients')
    .select('patient_id, name, phone')
    .order('name', { ascending: true })

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Opticals</h1>
      <PosForm 
        availableProducts={products || []} 
        patients={patients || []}
        userId={user.id} 
      />

      <PosRecentSalesTable sales={recentSales || []} canEdit={hasRole(userRoles, 'store_manager')} />
    </div>
  )
}
