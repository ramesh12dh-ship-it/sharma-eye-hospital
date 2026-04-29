'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteSale(saleId: string) {
  const supabase = await createClient()

  // Verify user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (roleData?.role !== 'admin') {
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
