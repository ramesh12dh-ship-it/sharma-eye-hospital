import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch the user's role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const role = roleData?.role

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Welcome to the Dashboard</h1>
      <p style={{ fontSize: '1.125rem', color: '#4b5563', marginBottom: '2rem' }}>
        You are logged in as: <strong>{role || 'Unknown Role'}</strong>
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {(role === 'admin' || role === 'store_manager') && (
          <div style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Inventory Management</h2>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              {role === 'admin' ? 'Add new stock, update quantities, and view full pricing details.' : 'View current stock levels and available products.'}
            </p>
            <a href="/dashboard/inventory" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>Go to Inventory &rarr;</a>
          </div>
        )}

        {(role === 'admin' || role === 'store_manager') && (
          <div style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Point of Sale</h2>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>Record a new sale and deduct from inventory.</p>
            <a href="/dashboard/pos" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>Go to POS &rarr;</a>
          </div>
        )}

        {(role === 'admin' || role === 'accountant') && (
          <div style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Financial Reports</h2>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>View daily and monthly sales summaries.</p>
            <a href="/dashboard/reports" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>Go to Reports &rarr;</a>
          </div>
        )}
      </div>
    </div>
  )
}
