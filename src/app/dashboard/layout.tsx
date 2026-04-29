import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import styles from './dashboard.module.css'
import { hasRole } from '@/utils/roles'

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

  // Fetch ALL roles for this user (multi-role support)
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const userRoles = roleData?.map(r => r.role) ?? []

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>Sharma Eye Hospital</div>
        <nav className={styles.nav}>
          <Link href="/dashboard" className={styles.navLink}>Home</Link>
          {hasRole(userRoles, 'store_manager') && (
            <Link href="/dashboard/inventory" className={styles.navLink}>Inventory</Link>
          )}
          {(hasRole(userRoles, 'receptionist') || hasRole(userRoles, 'store_manager')) && (
            <Link href="/dashboard/pos" className={styles.navLink}>Opticals</Link>
          )}
          {(hasRole(userRoles, 'receptionist') || hasRole(userRoles, 'store_manager') || hasRole(userRoles, 'doctor') || hasRole(userRoles, 'optician')) && (
            <Link href="/dashboard/patients" className={styles.navLink}>Patients</Link>
          )}
          {(hasRole(userRoles, 'optician') || hasRole(userRoles, 'receptionist') || hasRole(userRoles, 'store_manager')) && (
            <Link href="/dashboard/orders" className={styles.navLink}>Orders</Link>
          )}
          {hasRole(userRoles, 'accountant') && (
            <Link href="/dashboard/reports" className={styles.navLink}>Reports</Link>
          )}
          {hasRole(userRoles, 'admin') && (
            <Link href="/dashboard/admin" className={styles.navLink}>Admin</Link>
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
