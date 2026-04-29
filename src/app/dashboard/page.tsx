import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { hasRole, roleLabel } from '@/utils/roles'
import { formatCurrency } from '@/utils/currency'

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

  // Fetch stats for today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { data: todaySales } = await supabase
    .from('sales')
    .select('sale_amount')
    .gte('sale_date', today.toISOString())
    .eq('is_voided', false)

  const { count: pendingOrders } = await supabase
    .from('optical_orders')
    .select('*', { count: 'exact', head: true })
    .in('status', ['ordered', 'in_workshop'])

  const totalToday = todaySales?.reduce((acc, s) => acc + Number(s.sale_amount), 0) || 0

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>Welcome to Sharma Eye Hospital</h1>
        <p style={{ fontSize: '1rem', color: '#6b7280', marginTop: '0.25rem' }}>
          Role: <strong style={{ color: '#111827' }}>{rolesDisplay || 'Unknown Role'}</strong>
        </p>
      </div>

      {/* TODAY'S SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div style={{ padding: '1.25rem', backgroundColor: '#eff6ff', borderRadius: '0.75rem', border: '1px solid #dbeafe' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today's Revenue</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e3a8a', marginTop: '0.5rem' }}>₹{totalToday.toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '0.8rem', color: '#60a5fa', marginTop: '0.25rem' }}>{todaySales?.length || 0} items sold today</div>
        </div>
        
        <div style={{ padding: '1.25rem', backgroundColor: '#fef2f2', borderRadius: '0.75rem', border: '1px solid #fee2e2' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Orders</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7f1d1d', marginTop: '0.5rem' }}>{pendingOrders || 0}</div>
          <div style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '0.25rem' }}>Requires attention in workshop</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#f0fdf4', borderRadius: '0.75rem', border: '1px solid #dcfce7' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Store Status</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#064e3b', marginTop: '0.5rem' }}>Open</div>
          <div style={{ fontSize: '0.8rem', color: '#4ade80', marginTop: '0.25rem' }}>System healthy</div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.25rem', color: '#374151' }}>Quick Navigation</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {hasRole(userRoles, 'store_manager') && (
          <div style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>Inventory</h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.25rem' }}>Manage products, stock levels, and pricing.</p>
            <a href="/dashboard/inventory" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600', fontSize: '0.875rem' }}>Open Inventory &rarr;</a>
          </div>
        )}

        {(hasRole(userRoles, 'store_manager') || hasRole(userRoles, 'receptionist')) && (
          <div style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>Opticals (POS)</h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.25rem' }}>Create sales, print invoices, and track orders.</p>
            <a href="/dashboard/pos" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600', fontSize: '0.875rem' }}>Open POS &rarr;</a>
          </div>
        )}

        {(hasRole(userRoles, 'receptionist') || hasRole(userRoles, 'store_manager') || hasRole(userRoles, 'doctor')) && (
          <div style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>Patients</h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.25rem' }}>Patient files, history, and prescriptions.</p>
            <a href="/dashboard/patients" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600', fontSize: '0.875rem' }}>Open Patient List &rarr;</a>
          </div>
        )}

        {(hasRole(userRoles, 'optician') || hasRole(userRoles, 'receptionist')) && (
          <div style={{ padding: '1.5rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>Orders</h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.25rem' }}>Track workshop status and frame delivery.</p>
            <a href="/dashboard/orders" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600', fontSize: '0.875rem' }}>View Orders &rarr;</a>
          </div>
        )}
      </div>
    </div>
  )
}
