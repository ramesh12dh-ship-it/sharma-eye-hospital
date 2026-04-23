import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PosForm from './PosForm'

export default async function PosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const role = roleData?.role

  if (role !== 'admin' && role !== 'store_manager') {
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

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Point of Sale</h1>
      <PosForm 
        availableProducts={products || []} 
        userId={user.id} 
      />
    </div>
  )
}
