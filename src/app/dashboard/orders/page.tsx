import { Suspense } from 'react'
import { getAuthUser, getUserRoles, createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import OrdersList from './OrdersList'
import { hasRole } from '@/utils/roles'
import { PageHeader } from '@/components/ui/PageHeader'
import { AccessDenied } from '@/components/ui/AccessDenied'

export default async function OrdersPage() {
  const [user, userRoles, supabase] = await Promise.all([getAuthUser(), getUserRoles(), createClient()])
  if (!user) redirect('/login')

  if (!hasRole(userRoles, 'store_manager') && !hasRole(userRoles, 'receptionist') && !hasRole(userRoles, 'optician')) {
    return <AccessDenied resource="optical orders" />
  }

  const [activeOrdersRes, recentDeliveredRes] = await Promise.all([
    supabase.from('optical_orders')
      .select(`*, patients ( name, phone )`)
      .neq('status', 'delivered')
      .order('created_at', { ascending: false }),
    supabase.from('optical_orders')
      .select(`*, patients ( name, phone )`)
      .eq('status', 'delivered')
      .order('actual_delivery', { ascending: false })
      .limit(5),
  ])

  const activeOrders = activeOrdersRes.data
  const recentDelivered = recentDeliveredRes.data

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
