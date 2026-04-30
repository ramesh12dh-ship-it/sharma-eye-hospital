import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Supabase session refresher.
 *
 * Without this proxy, server components can't write cookies (Next.js silently
 * drops cookie writes from RSC), so Supabase sessions can drift between
 * requests. Symptom: OAuth completes, but the user lands back at the login
 * page because the session cookies never made it to the browser.
 *
 * This runs before every page render (see matcher below), gives Supabase a
 * chance to refresh the access token, and forwards the resulting cookies on
 * the response. It's the canonical Supabase-on-Next-App-Router pattern.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Mutate the request's cookies (so downstream RSCs see the fresh
          // values) AND emit set-cookie headers on the response.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Touching the user triggers session refresh if needed; the refreshed
  // cookies are written via the setAll callback above.
  await supabase.auth.getUser()

  return response
}

export const config = {
  // Skip static assets, image optimization, and Next internals. Run on
  // everything else — including / and /auth/* so OAuth flows benefit.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
