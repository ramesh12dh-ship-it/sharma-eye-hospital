import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { hasRole, roleLabel } from '@/utils/roles'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const userRoles = roleData?.map(r => r.role) ?? []
  const rolesDisplay = userRoles.map(roleLabel).join(', ')

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Welcome to the Dashboard</h1>
      <p style={{ fontSize: '1rem', color: '#4b5563', marginBottom: '2rem' }}>
        Logged in as: <strong>{rolesDisplay || 'Unknown Role'}</strong>
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {hasRole(userRoles, 'store_manager') && (
          <div style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Inventory Management</h2>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              {userRoles.includes('admin') ? 'Add new stock, update quantities, and view full pricing details.' : 'View current stock levels and available products.'}
            </p>
            <a href="/dashboard/inventory" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>Go to Inventory &rarr;</a>
          </div>
        )}

        {(hasRole(userRoles, 'store_manager') || hasRole(userRoles, 'receptionist')) && (
          <div style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Point of Sale</h2>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>Record a new sale and deduct from inventory.</p>
            <a href="/dashboard/pos" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>Go to POS &rarr;</a>
          </div>
        )}

        {(hasRole(userRoles, 'receptionist') || hasRole(userRoles, 'store_manager')) && (
          <div style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Patients</h2>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>Manage patient records and contact information.</p>
            <a href="/dashboard/patients" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>Go to Patients &rarr;</a>
          </div>
        )}

        {hasRole(userRoles, 'accountant') && (
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
