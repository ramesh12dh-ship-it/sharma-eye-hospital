'use server'

import { createClient } from '@/utils/supabase/server'
import { getAdminClient } from '@/utils/supabase/admin'
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

export async function createFullUser(email: string, password: string, role: string) {
  try {
    const adminClient = await getAdminClient()

    // 1. Create the user in auth.users
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Skip email verification for internal users
    })

    if (authError) return { error: authError.message }
    if (!authUser.user) return { error: 'Failed to create user' }

    // 2. Assign the initial role
    // Note: The trigger 'on_auth_user_created' might fail if the email isn't in the hardcoded list.
    // We will manually insert into user_roles using the admin client to ensure it works.
    const { error: roleError } = await adminClient
      .from('user_roles')
      .insert({
        user_id: authUser.user.id,
        email: email.toLowerCase(),
        role: role
      })

    if (roleError) {
      console.error('Role assignment error:', roleError)
      return { error: 'User created but role assignment failed. You can assign it manually now.' }
    }

    revalidatePath('/dashboard/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function deleteFullUser(userId: string) {
  try {
    const adminClient = await getAdminClient()

    // 1. Delete from auth.users (this will cascade to user_roles due to our schema FK)
    const { error } = await adminClient.auth.admin.deleteUser(userId)

    if (error) return { error: error.message }
    
    revalidatePath('/dashboard/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
