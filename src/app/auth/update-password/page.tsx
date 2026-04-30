import { updatePassword } from '@/app/actions'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/brand/Logo'
import { Watermark } from '@/components/brand/Watermark'

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; code?: string }>
}) {
  const resolved = await searchParams
  const supabase = await createClient()

  if (resolved.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(resolved.code)
    if (error) redirect(`/?message=${error.message}`)
    redirect('/auth/update-password')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?message=You must use a valid reset link to access this page')

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 1100px 700px at 50% 0%, color-mix(in oklch, var(--color-brand-500) 14%, transparent) 0%, transparent 60%)',
        }}
      />
      <Watermark size={680} opacity={0.05} className="-right-40 -top-40" />

      <div className="glass-strong relative w-full max-w-[440px] rounded-2xl p-8 sm:p-10">
        <div className="mb-7 flex items-center gap-3">
          <Logo size={36} />
          <div>
            <div className="text-[14px] font-semibold tracking-tight text-ink-900">
              Sharma Eye Hospital
            </div>
            <div className="text-[11px] text-ink-500">Update password</div>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">
            Set a new password
          </h1>
          <p className="mt-1 text-[13px] text-ink-500">
            Choose something memorable. Minimum 6 characters.
          </p>
        </div>

        <form className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1.5 block text-[12px] font-medium text-ink-700">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="block w-full rounded-lg border border-hairline bg-white/70 px-3.5 py-2.5 text-[14px] text-ink-900 placeholder:text-ink-400 transition-shadow focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              placeholder="••••••••"
            />
          </div>

          <button
            formAction={updatePassword}
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-sm transition-all duration-[var(--duration-fast)] hover:bg-brand-700 hover:shadow-md active:scale-[0.99]"
          >
            Save new password
          </button>

          {resolved?.message && (
            <p className="rounded-lg border border-coral-200 bg-coral-50 px-3.5 py-2.5 text-[12.5px] font-medium text-coral-700">
              {resolved.message}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
