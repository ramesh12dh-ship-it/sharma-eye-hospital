import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { hasRole } from '@/utils/roles'
import PatientFile from './PatientFile'
import { AccessDenied } from '@/components/ui/AccessDenied'

export default async function PatientFilePage({ params }: { params: Promise<{ patient_id: string }> }) {
  const { patient_id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: roleData } = await supabase
    .from('user_roles').select('role').eq('user_id', user.id)
  const userRoles = roleData?.map(r => r.role) ?? []

  if (!hasRole(userRoles, 'receptionist') && !hasRole(userRoles, 'store_manager') && !hasRole(userRoles, 'optician')) {
    return <AccessDenied resource="this patient file" />
  }

  const { data: patient } = await supabase
    .from('patients')
    .select('patient_id, name, phone, age, address, created_at')
    .eq('patient_id', patient_id)
    .single()

  if (!patient) notFound()

  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('patient_id', patient_id)
    .order('created_at', { ascending: false })

  const { data: sales } = await supabase
    .from('sales')
    .select('sale_id, sale_date, product_code, sale_amount, tax_rate, payment_mode, transaction_id')
    .eq('patient_id', patient_id)
    .order('sale_date', { ascending: false })
    .limit(30)

  const { data: orders } = await supabase
    .from('optical_orders')
    .select('*')
    .eq('patient_id', patient_id)
    .order('created_at', { ascending: false })

  const canWrite = hasRole(userRoles, 'optician')
  const canUpdateOrders = hasRole(userRoles, 'store_manager')

  return (
    <PatientFile
      patient={patient}
      prescriptions={prescriptions ?? []}
      sales={sales ?? []}
      orders={orders ?? []}
      canWrite={canWrite}
      canUpdateOrders={canUpdateOrders}
      userId={user.id}
    />
  )
}
