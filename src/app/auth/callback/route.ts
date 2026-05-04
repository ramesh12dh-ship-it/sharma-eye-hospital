import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Auth callback — exchanges OAuth/PKCE codes for a session.
 *
 * This is a Route Handler so cookies set by `exchangeCodeForSession` actually
 * persist (Server Components silently drop cookie writes). Both the home
 * page and the password-reset page forward `?code=...` here for the same
 * reason — keeps the cookie-writing path in one place.
 *
 * Optional `?next=/some/path` controls where to land on success (defaults
 * to /dashboard). Only same-origin paths are honored.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  const nextParam = searchParams.get('next')
  const next = nextParam && nextParam.startsWith('/') ? nextParam : '/dashboard'

  // Supabase sometimes redirects back with its own error params instead of a
  // code (config mismatch, expired flow, etc). Surface to the login page
  // rather than producing a confusing "no code" error.
  const supabaseError = searchParams.get('error_description') ?? searchParams.get('error')
  if (supabaseError) {
    return NextResponse.redirect(
      `${origin}/login?message=${encodeURIComponent(supabaseError)}`,
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    // If the code was already exchanged (browser pre-fetch, replay) the
    // user likely already has a session — send them onwards. The layout's
    // auth gate will bounce to / if they're actually signed out.
    if (error.message?.toLowerCase().includes('already used')) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    return NextResponse.redirect(
      `${origin}/login?message=${encodeURIComponent(error.message)}`,
    )
  }

  return NextResponse.redirect(`${origin}/login?message=Could not authenticate with Google`)
}
