'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addRole(userId: string, email: string, role: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, email, role })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin')
  return { success: true }
}

export async function removeRole(userId: string, role: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', role)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/admin')
  return { success: true }
}
