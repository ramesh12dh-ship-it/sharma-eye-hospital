import { login, resetPassword, signInWithGoogle } from './actions'
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

          <div style={{ position: 'relative', marginTop: '2rem', marginBottom: '2rem' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '100%', borderTop: '1px solid #e5e7eb' }}></div>
            </div>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', fontSize: '0.875rem' }}>
              <span style={{ backgroundColor: 'white', padding: '0 0.5rem', color: '#6b7280' }}>Or continue with</span>
            </div>
          </div>

          <button 
            formAction={signInWithGoogle}
            formNoValidate
            className={styles.button} 
            style={{ width: '100%', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.8 15.72 17.58V20.34H19.29C21.37 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
              <path d="M12 23C14.97 23 17.46 22.02 19.29 20.34L15.72 17.58C14.73 18.24 13.48 18.64 12 18.64C9.13 18.64 6.7 16.7 5.84 14.09H2.15V16.95C3.96 20.55 7.69 23 12 23Z" fill="#34A853"/>
              <path d="M5.84 14.09C5.62 13.43 5.5 12.73 5.5 12C5.5 11.27 5.62 10.57 5.84 9.91V7.05H2.15C1.41 8.52 1 10.21 1 12C1 13.79 1.41 15.48 2.15 16.95L5.84 14.09Z" fill="#FBBC05"/>
              <path d="M12 5.36C13.62 5.36 15.06 5.92 16.2 7.02L19.36 3.86C17.46 2.09 14.97 1 12 1C7.69 1 3.96 3.45 2.15 7.05L5.84 9.91C6.7 7.3 9.13 5.36 12 5.36Z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          
          {resolvedSearchParams?.message && (
            <p className={styles.error} style={{ marginTop: '1rem' }}>{resolvedSearchParams.message}</p>
          )}
        </form>
      </div>
    </div>
  )
}
