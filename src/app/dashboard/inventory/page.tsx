import { Suspense } from 'react'
import { getAuthUser, getUserRoles, createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import InventoryTable from './InventoryTable'
import { hasRole } from '@/utils/roles'
import { PageHeader } from '@/components/ui/PageHeader'
import { AccessDenied } from '@/components/ui/AccessDenied'

export default async function InventoryPage() {
  const [user, userRoles, supabase] = await Promise.all([getAuthUser(), getUserRoles(), createClient()])
  if (!user) redirect('/login')

  if (!hasRole(userRoles, 'store_manager')) {
    return <AccessDenied resource="Inventory" />
  }

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('date_added', { ascending: false })

  if (error) console.error('Error fetching products:', error)

  const effectiveRole = userRoles.includes('admin') ? 'admin' : 'store_manager'

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Manage stock, pricing, and product catalogue."
      />
      <Suspense fallback={null}>
        <InventoryTable initialProducts={products || []} userRole={effectiveRole} />
      </Suspense>
    </div>
  )
}
