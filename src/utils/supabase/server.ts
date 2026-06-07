import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // ignored when called from a Server Component
          }
        },
      },
    }
  )
}

// Deduplicated per-request via React cache — layout + page share one round-trip.
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export const getUserRoles = cache(async () => {
  const user = await getAuthUser()
  if (!user) return []
  const supabase = await createClient()
  const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id)
  return data?.map(r => r.role) ?? []
})
