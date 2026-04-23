import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import InventoryTable from './InventoryTable'

export default async function InventoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Ensure user is admin
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (roleData?.role !== 'admin' && roleData?.role !== 'store_manager') {
    return (
      <div>
        <h1 style={{ color: 'red', fontSize: '1.5rem', fontWeight: 'bold' }}>Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    )
  }

  // Fetch products
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('date_added', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Inventory Management</h1>
      </div>
      
      <InventoryTable initialProducts={products || []} userRole={roleData?.role} />
    </div>
  )
}
