import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ExportButton from './ExportButton'
import ReportsTable from './ReportsTable'
import styles from './reports.module.css'
import { hasRole } from '@/utils/roles'

export default async function ReportsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const userRoles = roleData?.map(r => r.role) ?? []
  const role = userRoles.includes('admin') ? 'admin' : (userRoles[0] ?? '')

  if (!hasRole(userRoles, 'accountant')) {
    return (
      <div>
        <h1 style={{ color: 'red', fontSize: '1.5rem', fontWeight: 'bold' }}>Access Denied</h1>
        <p>You do not have permission to view Financial Reports.</p>
      </div>
    )
  }

  // Fetch sales from the last 30 days to prevent the page from crashing with too much data
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Fetch sales and join with products to get sale_price_a
  const { data: sales, error } = await supabase
    .from('sales')
    .select(`
      sale_id,
      product_code,
      sale_date,
      payment_mode,
      tax_rate,
      recorded_by,
      products (
        sale_price_a
      )
    `)
    .gte('sale_date', thirtyDaysAgo.toISOString())
    .order('sale_date', { ascending: false })

  if (error) {
    console.error('Error fetching sales:', error)
  }

  // Helper to safely get the correct account price (defaulting to 0 if null)
  const getAccountPrice = (sale: any) => Number(sale.products?.sale_price_a || 0)

  // Calculate totals using sale_price_a
  const totalSales = sales?.reduce((sum, sale) => sum + getAccountPrice(sale), 0) || 0
  const totalTax = sales?.reduce((sum, sale) => sum + (getAccountPrice(sale) * Number(sale.tax_rate) / 100), 0) || 0

  // Format data specifically for clean CSV export
  const exportData = sales?.map(sale => ({
    "Date": new Date(sale.sale_date).toLocaleString(),
    "Product Code": sale.product_code,
    "Payment Mode": sale.payment_mode,
    "Tax Rate (%)": sale.tax_rate,
    "Amount (Accounts)": getAccountPrice(sale)
  })) || []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className={styles.title} style={{ marginBottom: 0 }}>Financial Reports</h1>
        <ExportButton data={exportData} filename="financial_reports_30days.csv" className={styles.exportBtn} />
      </div>

      <div className={styles.summaryCards}>
        <div className={styles.card}>
          <h3>Total Revenue (Last 30 Days)</h3>
          <p className={styles.cardValue}>₹{totalSales.toFixed(2)}</p>
        </div>
        <div className={styles.card}>
          <h3>Tax Collected (Last 30 Days)</h3>
          <p className={styles.cardValue}>₹{totalTax.toFixed(2)}</p>
        </div>
        <div className={styles.card}>
          <h3>Transactions (Last 30 Days)</h3>
          <p className={styles.cardValue}>{sales?.length || 0}</p>
        </div>
      </div>

      <ReportsTable sales={sales || []} role={role} />
    </div>
  )
}
