import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import OrdersList from './OrdersList'
import { hasRole } from '@/utils/roles'
import { PageHeader } from '@/components/ui/PageHeader'
import { AccessDenied } from '@/components/ui/AccessDenied'

export default async function OrdersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const userRoles = roleData?.map(r => r.role) ?? []

  if (!hasRole(userRoles, 'store_manager') && !hasRole(userRoles, 'receptionist') && !hasRole(userRoles, 'optician')) {
    return <AccessDenied resource="optical orders" />
  }

  const { data: activeOrders } = await supabase
    .from('optical_orders')
    .select(`*, patients ( name, phone )`)
    .neq('status', 'delivered')
    .order('created_at', { ascending: false })

  const { data: recentDelivered } = await supabase
    .from('optical_orders')
    .select(`*, patients ( name, phone )`)
    .eq('status', 'delivered')
    .order('actual_delivery', { ascending: false })
    .limit(5)

  return (
    <div>
      <PageHeader
        title="Optical orders"
        description="Workshop tracker — from order placed to delivery."
        actions={
          <div className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[12px] font-semibold text-brand-700">
            {activeOrders?.length ?? 0} active jobs
          </div>
        }
      />
      <Suspense fallback={null}>
        <OrdersList
          initialActiveOrders={activeOrders || []}
          initialDeliveredOrders={recentDelivered || []}
          userRole={userRoles[0]}
        />
      </Suspense>
    </div>
  )
}
