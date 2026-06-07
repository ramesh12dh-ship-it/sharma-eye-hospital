import { getAuthUser, getUserRoles, createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { hasRole } from '@/utils/roles'
import PatientFile from './PatientFile'
import { AccessDenied } from '@/components/ui/AccessDenied'

export default async function PatientFilePage({ params }: { params: Promise<{ patient_id: string }> }) {
  const [{ patient_id }, user, userRoles, supabase] = await Promise.all([
    params,
    getAuthUser(),
    getUserRoles(),
    createClient(),
  ])
  if (!user) redirect('/login')

  if (!hasRole(userRoles, 'receptionist') && !hasRole(userRoles, 'store_manager') && !hasRole(userRoles, 'optician')) {
    return <AccessDenied resource="this patient file" />
  }

  const [patientRes, prescriptionsRes, salesRes, ordersRes] = await Promise.all([
    supabase.from('patients')
      .select('patient_id, name, phone, age, address, created_at')
      .eq('patient_id', patient_id)
      .single(),
    supabase.from('prescriptions')
      .select('*')
      .eq('patient_id', patient_id)
      .order('created_at', { ascending: false }),
    supabase.from('sales')
      .select('sale_id, sale_date, product_code, sale_amount, tax_rate, payment_mode, transaction_id')
      .eq('patient_id', patient_id)
      .order('sale_date', { ascending: false })
      .limit(30),
    supabase.from('optical_orders')
      .select('*')
      .eq('patient_id', patient_id)
      .order('created_at', { ascending: false }),
  ])

  const patient = patientRes.data
  if (!patient) notFound()

  const canWrite = hasRole(userRoles, 'optician')
  const canUpdateOrders = hasRole(userRoles, 'store_manager')

  return (
    <PatientFile
      patient={patient}
      prescriptions={prescriptionsRes.data ?? []}
      sales={salesRes.data ?? []}
      orders={ordersRes.data ?? []}
      canWrite={canWrite}
      canUpdateOrders={canUpdateOrders}
      userId={user.id}
    />
  )
}
