'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { hasRole } from '@/utils/roles'

export async function deleteSale(saleId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const userRoles = roleData?.map(r => r.role) ?? []
  if (!hasRole(userRoles, 'admin')) {
    return { error: 'Only admins can delete sales' }
  }

  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('sale_id', saleId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/reports')
  revalidatePath('/dashboard/inventory')
  return { success: true }
}
