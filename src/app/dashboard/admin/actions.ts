'use server'

import { createClient } from '@/utils/supabase/server'
import { getAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { hasRole } from '@/utils/roles'

/**
 * SECURE ADMIN CHECK
 * Ensures the requester is authenticated and has the 'admin' role.
 */
async function ensureAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const userRoles = roles?.map(r => r.role) ?? []
  if (!hasRole(userRoles, 'admin')) {
    throw new Error('Access Denied: Admin role required')
  }
}

export async function addRole(userId: string, email: string, role: string) {
  try {
    await ensureAdmin()
    const supabase = await createClient()
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, email, role })

    if (error) return { error: error.message }
    revalidatePath('/dashboard/admin')
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function removeRole(userId: string, role: string) {
  try {
    await ensureAdmin()
    const supabase = await createClient()
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/admin')
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function createFullUser(email: string, password: string, role: string) {
  try {
    await ensureAdmin()
    const adminClient = await getAdminClient()

    // 1. Create the user in auth.users
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) return { error: authError.message }
    if (!authUser.user) return { error: 'Failed to create user' }

    // 2. Assign the initial role
    const { error: roleError } = await adminClient
      .from('user_roles')
      .insert({
        user_id: authUser.user.id,
        email: email.toLowerCase(),
        role: role
      })

    if (roleError) {
      return { error: 'User created but role assignment failed.' }
    }

    revalidatePath('/dashboard/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function deleteFullUser(userId: string) {
  try {
    await ensureAdmin()
    const adminClient = await getAdminClient()

    // 1. Delete from auth.users
    const { error } = await adminClient.auth.admin.deleteUser(userId)

    if (error) return { error: error.message }
    
    revalidatePath('/dashboard/admin')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
