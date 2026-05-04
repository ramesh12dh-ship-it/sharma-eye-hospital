import { login, resetPassword, signInWithGoogle } from '@/app/actions'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/brand/Logo'
import { Watermark } from '@/components/brand/Watermark'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    message?: string
    code?: string
    error?: string
    error_description?: string
  }>
}) {
  const supabase = await createClient()
  const resolved = await searchParams

  // OAuth redirect arrived at "/" instead of "/auth/callback" (Site URL
  // fallback when redirectTo isn't an exact allowlist match). Forward to
  // the Route Handler — it can write session cookies; a Server Component
  // here cannot, which is why exchanging in place silently fails to log in.
  if (resolved.code) {
    return redirect(`/auth/callback?code=${encodeURIComponent(resolved.code)}`)
  }

  // Supabase sometimes redirects with its own error params instead of a code
  // (`?error=...&error_description=...`). Surface those as a friendly message.
  if (resolved.error_description || resolved.error) {
    const msg = resolved.error_description ?? resolved.error ?? 'Authentication failed'
    return redirect(`/login?message=${encodeURIComponent(msg)}`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  let staffAccessMessage: string | undefined
  if (user) {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    if ((roleData?.length ?? 0) > 0) {
      return redirect('/dashboard')
    }

    staffAccessMessage = 'This signed-in account does not have staff access.'
  }

  const isPositive =
    resolved?.message?.toLowerCase().includes('check your email') ||
    resolved?.message?.toLowerCase().includes('successfully')

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden p-6">
      {/* Background composition: brand gradient + watermark spiral */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 1100px 700px at 78% 18%, color-mix(in oklch, var(--color-brand-500) 18%, transparent) 0%, transparent 60%), radial-gradient(ellipse 800px 600px at 20% 100%, color-mix(in oklch, var(--color-accent-500) 8%, transparent) 0%, transparent 55%)',
        }}
      />
      <Watermark
        size={900}
        opacity={0.06}
        className="-right-60 -top-40 hidden md:block"
      />
      <Watermark
        size={520}
        opacity={0.05}
        className="-left-40 -bottom-32 hidden md:block"
      />

      <div className="relative grid w-full max-w-[1080px] gap-10 lg:grid-cols-[1.05fr_1fr]">
        {/* Left: brand panel (hidden on small screens) */}
        <div className="hidden flex-col justify-between p-2 lg:flex">
          <div className="flex items-center gap-3">
            <Logo size={48} halo />
            <div className="leading-tight">
              <div className="text-[15px] font-semibold tracking-tight text-ink-900">
                Sharma Eye Hospital
              </div>
              <div className="text-[12px] font-medium text-ink-500">
                Internal Inventory & Care Operations
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-[44px] font-semibold leading-[1.05] tracking-[-0.025em] text-ink-900">
              Vision
              <br />
              <span className="text-brand-600">with care.</span>
            </h1>
            <p className="max-w-md text-[14.5px] leading-relaxed text-ink-600">
              A quiet workspace for the team — patients, prescriptions, opticals,
              and orders, all in one calm place.
            </p>
          </div>

          <div className="flex items-center gap-6 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-400">
            <span>Inventory</span>
            <span className="h-1 w-1 rounded-full bg-ink-300" />
            <span>Patients</span>
            <span className="h-1 w-1 rounded-full bg-ink-300" />
            <span>Reports</span>
          </div>
        </div>

        {/* Right: login card */}
        <div className="glass-strong relative rounded-2xl p-8 sm:p-10">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo size={36} />
            <div className="text-[14px] font-semibold tracking-tight text-ink-900">
              Sharma Eye Hospital
            </div>
          </div>

          <div className="mb-7">
            <h2 className="text-[22px] font-semibold tracking-tight text-ink-900">
              Welcome back
            </h2>
            <p className="mt-1 text-[13.5px] text-ink-500">
              Sign in to continue to your dashboard.
            </p>
          </div>

          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[12px] font-medium text-ink-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="block w-full rounded-lg border border-hairline bg-white/70 px-3.5 py-2.5 text-[14px] text-ink-900 placeholder:text-ink-400 transition-shadow focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                placeholder="you@hospital.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-[12px] font-medium text-ink-700">
                Password
                <span className="ml-1 font-normal text-ink-400">
                  (leave blank to reset)
                </span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="block w-full rounded-lg border border-hairline bg-white/70 px-3.5 py-2.5 text-[14px] text-ink-900 placeholder:text-ink-400 transition-shadow focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                placeholder="••••••••"
              />
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                formAction={login}
                className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-sm transition-all duration-[var(--duration-fast)] hover:bg-brand-700 hover:shadow-md active:scale-[0.99]"
              >
                Sign in
              </button>
              <button
                formAction={resetPassword}
                className="rounded-lg border border-hairline bg-white/60 px-4 py-2.5 text-[13.5px] font-medium text-ink-700 transition-colors hover:bg-white hover:text-ink-900"
              >
                Forgot
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-hairline" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white/0 px-3 text-[11px] font-medium uppercase tracking-[0.16em] text-ink-400">
                  or continue with
                </span>
              </div>
            </div>

            <button
              formAction={signInWithGoogle}
              formNoValidate
              className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-hairline bg-white/80 px-4 py-2.5 text-[13.5px] font-medium text-ink-800 transition-all hover:bg-white hover:shadow-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" fill="#34A853" />
                <path d="M5.84 13.7a6.6 6.6 0 0 1 0-4.21V6.66H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 6.66l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            {(resolved?.message || staffAccessMessage) && (
              <p
                role="status"
                className={
                  isPositive && !staffAccessMessage
                    ? 'mt-4 rounded-lg border border-accent-200 bg-accent-50 px-3.5 py-2.5 text-[12.5px] font-medium text-accent-700'
                    : 'mt-4 rounded-lg border border-coral-200 bg-coral-50 px-3.5 py-2.5 text-[12.5px] font-medium text-coral-700'
                }
              >
                {staffAccessMessage ?? resolved.message}
              </p>
            )}
          </form>

          {staffAccessMessage && (
            <form action="/auth/signout" method="post" className="mt-3">
              <button className="w-full rounded-lg border border-hairline bg-white/60 px-4 py-2.5 text-[13.5px] font-medium text-ink-700 transition-colors hover:bg-white hover:text-ink-900">
                Sign out
              </button>
            </form>
          )}

          <p className="mt-7 text-center text-[11.5px] text-ink-400">
            Authorized staff only · Need access?{' '}
            <span className="font-medium text-ink-500">Contact admin</span>
          </p>
        </div>
      </div>
    </div>
  )
}
