import { login, resetPassword } from './actions'
import styles from './page.module.css'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    return redirect('/dashboard')
  }

  const resolvedSearchParams = await searchParams

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.header}>
          <h1 className={styles.title}>Sharma Eye Hospital</h1>
          <p className={styles.subtitle}>Inventory & Sales Management</p>
        </div>

        <form className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              className={styles.input}
              id="email"
              name="email"
              type="email"
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Password (leave blank if resetting)</label>
            <input
              className={styles.input}
              id="password"
              name="password"
              type="password"
            />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button formAction={login} className={styles.button} style={{ flex: 1 }}>
              Sign In
            </button>
            <button formAction={resetPassword} className={styles.button} style={{ flex: 1, backgroundColor: '#6b7280' }}>
              Forgot Password
            </button>
          </div>
          
          {resolvedSearchParams?.message && (
            <p className={styles.error} style={{ marginTop: '1rem' }}>{resolvedSearchParams.message}</p>
          )}
        </form>
      </div>
    </div>
  )
}
