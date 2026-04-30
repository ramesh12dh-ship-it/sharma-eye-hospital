import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PatientsTable from './PatientsTable'
import { hasRole } from '@/utils/roles'
import { PageHeader } from '@/components/ui/PageHeader'
import { AccessDenied } from '@/components/ui/AccessDenied'

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
    return <AccessDenied resource="patient records" />
  }

  const { data: patients, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) console.error('Error fetching patients:', error)

  return (
    <div>
      <PageHeader
        title="Patients"
        description="Manage records, contact details, and prescriptions."
      />
      <PatientsTable initialPatients={patients || []} userRole={role} />
    </div>
  )
}
