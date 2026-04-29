import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PatientsTable from './PatientsTable'
import { hasRole } from '@/utils/roles'

export default async function PatientsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const userRoles = roleData?.map(r => r.role) ?? []
  const role = userRoles.includes('admin') ? 'admin' : (userRoles[0] ?? '')

  if (!hasRole(userRoles, 'receptionist') && !hasRole(userRoles, 'store_manager') && !hasRole(userRoles, 'optician')) {
    return (
      <div>
        <h1 style={{ color: 'red', fontSize: '1.5rem', fontWeight: 'bold' }}>Access Denied</h1>
        <p>You do not have permission to view Patient records.</p>
      </div>
    )
  }

  const { data: patients, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching patients:', error)
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: '0 0 0.25rem' }}>Patients</h1>
        <p style={{ color: '#6b7280', margin: 0 }}>Manage patient records and contact information.</p>
      </div>

      <PatientsTable initialPatients={patients || []} userRole={role} />
    </div>
  )
}
