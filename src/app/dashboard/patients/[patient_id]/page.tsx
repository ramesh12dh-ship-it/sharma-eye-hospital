import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { hasRole } from '@/utils/roles'
import PatientFile from './PatientFile'

export default async function PatientFilePage({ params }: { params: Promise<{ patient_id: string }> }) {
  const { patient_id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: roleData } = await supabase
    .from('user_roles').select('role').eq('user_id', user.id)
  const userRoles = roleData?.map(r => r.role) ?? []

  if (!hasRole(userRoles, 'receptionist') && !hasRole(userRoles, 'store_manager') && !hasRole(userRoles, 'optician')) {
    return <div style={{ padding: '2rem', color: 'red' }}>Access Denied</div>
  }

  // Fetch patient
  const { data: patient } = await supabase
    .from('patients')
    .select('patient_id, name, phone, age, address, created_at')
    .eq('patient_id', patient_id)
    .single()

  if (!patient) notFound()

  // Fetch prescriptions
  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('patient_id', patient_id)
    .order('created_at', { ascending: false })

  // Fetch sales linked to this patient
  const { data: sales } = await supabase
    .from('sales')
    .select('sale_id, sale_date, product_code, sale_amount, tax_rate, payment_mode, transaction_id')
    .eq('patient_id', patient_id)
    .order('sale_date', { ascending: false })
    .limit(30)

  const canWrite = hasRole(userRoles, 'optician')

  return (
    <PatientFile
      patient={patient}
      prescriptions={prescriptions ?? []}
      sales={sales ?? []}
      canWrite={canWrite}
      userId={user.id}
    />
  )
}
