import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import InventoryTable from './InventoryTable'
import { hasRole } from '@/utils/roles'

export default async function InventoryPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const userRoles = roleData?.map(r => r.role) ?? []

  if (!hasRole(userRoles, 'store_manager')) {
    return (
      <div>
        <h1 style={{ color: 'red', fontSize: '1.5rem', fontWeight: 'bold' }}>Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    )
  }

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('date_added', { ascending: false })

  if (error) console.error('Error fetching products:', error)

  // Pass whether user is admin specifically for write operations in the table
  const effectiveRole = userRoles.includes('admin') ? 'admin' : 'store_manager'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Inventory Management</h1>
      </div>
      <InventoryTable initialProducts={products || []} userRole={effectiveRole} />
    </div>
  )
}
