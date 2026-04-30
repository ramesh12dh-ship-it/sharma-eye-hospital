import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Supabase sometimes redirects back with its own error params instead of a
  // code (config mismatch, expired flow, etc). Surface those to the login
  // page rather than running the exchange and producing a worse error.
  const supabaseError = searchParams.get('error_description') ?? searchParams.get('error')
  if (supabaseError) {
    return NextResponse.redirect(
      `${origin}/?message=${encodeURIComponent(supabaseError)}`,
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`)
    }

    // If the code was already exchanged (e.g. browser replayed the request),
    // the user likely already has a session. Send them to /dashboard — the
    // layout's auth gate will redirect to / if they actually aren't signed in.
    if (error.message?.toLowerCase().includes('already used')) {
      return NextResponse.redirect(`${origin}/dashboard`)
    }

    return NextResponse.redirect(
      `${origin}/?message=${encodeURIComponent(error.message)}`,
    )
  }

  return NextResponse.redirect(`${origin}/?message=Could not authenticate with Google`)
}
