import { login } from './actions'
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
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              className={styles.input}
              id="password"
              name="password"
              type="password"
              required
            />
          </div>
          
          <button formAction={login} className={styles.button}>
            Sign In
          </button>
          
          {resolvedSearchParams?.message && (
            <p className={styles.error}>{resolvedSearchParams.message}</p>
          )}
        </form>
      </div>
    </div>
  )
}
