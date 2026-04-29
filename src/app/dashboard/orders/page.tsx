import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import OrdersList from './OrdersList'
import { hasRole } from '@/utils/roles'

export default async function OrdersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const userRoles = roleData?.map(r => r.role) ?? []

  // Admins, Managers, Opticians, and Receptionists can see orders
  if (!hasRole(userRoles, 'store_manager') && 
      !hasRole(userRoles, 'receptionist') && 
      !hasRole(userRoles, 'optician')) {
    redirect('/dashboard')
  }

  // Fetch active orders (not delivered)
  const { data: activeOrders } = await supabase
    .from('optical_orders')
    .select(`
      *,
      patients (name, phone)
    `)
    .neq('status', 'delivered')
    .order('created_at', { ascending: false })

  // Fetch recently delivered orders (last 5)
  const { data: recentDelivered } = await supabase
    .from('optical_orders')
    .select(`
      *,
      patients (name, phone)
    `)
    .eq('status', 'delivered')
    .order('actual_delivery', { ascending: false })
    .limit(5)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Optical Orders</h1>
        <div style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
          {activeOrders?.length || 0} Active Jobs
        </div>
      </div>

      <OrdersList 
        initialActiveOrders={activeOrders || []} 
        initialDeliveredOrders={recentDelivered || []}
        userRole={userRoles[0]} // Pass primary role for permissions
      />
    </div>
  )
}
