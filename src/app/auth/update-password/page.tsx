import { updatePassword } from '@/app/actions'
import styles from '@/app/page.module.css'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string, code?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const supabase = await createClient()

  // If Supabase passed a PKCE code in the URL, exchange it for a session so we can update the password
  if (resolvedSearchParams.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(resolvedSearchParams.code)
    if (error) {
      redirect(`/?message=${error.message}`)
    }
    // Remove the code from the URL by redirecting to the clean path
    redirect('/auth/update-password')
  }

  // Verify the user is actually logged in (which happens after exchanging the code)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/?message=You must use a valid reset link to access this page')
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.header}>
          <h1 className={styles.title}>Update Password</h1>
          <p className={styles.subtitle}>Enter your new password below</p>
        </div>

        <form className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>New Password</label>
            <input
              className={styles.input}
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
            />
          </div>
          
          <button formAction={updatePassword} className={styles.button}>
            Save New Password
          </button>
          
          {resolvedSearchParams?.message && (
            <p className={styles.error} style={{ marginTop: '1rem' }}>{resolvedSearchParams.message}</p>
          )}
        </form>
      </div>
    </div>
  )
}
