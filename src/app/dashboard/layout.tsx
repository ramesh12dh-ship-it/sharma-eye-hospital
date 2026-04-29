import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import styles from './dashboard.module.css'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch the user's role
  const { data: roleData, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const userRole = roleData?.role

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>Sharma Eye Hospital</div>
        <nav className={styles.nav}>
          <Link href="/dashboard" className={styles.navLink}>Home</Link>
          {(userRole === 'admin' || userRole === 'store_manager') && (
            <Link href="/dashboard/inventory" className={styles.navLink}>Inventory</Link>
          )}
          {(userRole === 'admin' || userRole === 'store_manager') && (
            <Link href="/dashboard/pos" className={styles.navLink}>Point of Sale</Link>
          )}
          {(userRole === 'admin' || userRole === 'receptionist' || userRole === 'store_manager') && (
            <Link href="/dashboard/patients" className={styles.navLink}>Patients</Link>
          )}
          {(userRole === 'admin' || userRole === 'accountant') && (
            <Link href="/dashboard/reports" className={styles.navLink}>Reports</Link>
          )}
          <form action="/auth/signout" method="post" style={{ display: 'inline' }}>
            <button type="submit" className={styles.signOutBtn}>Sign Out</button>
          </form>
        </nav>
      </header>
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}
