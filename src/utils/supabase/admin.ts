import { createClient } from '@supabase/supabase-js'

/**
 * SECURE ADMIN CLIENT
 * This client uses the SUPABASE_SERVICE_ROLE_KEY to bypass RLS and manage users.
 * NEVER use this in a client component. ONLY use in Server Actions or Route Handlers.
 */
export async function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase Admin Environment Variables')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
