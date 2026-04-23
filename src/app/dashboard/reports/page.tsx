import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ExportButton from './ExportButton'
import styles from './reports.module.css'

export default async function ReportsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const role = roleData?.role

  if (role !== 'admin' && role !== 'accountant') {
    return (
      <div>
        <h1 style={{ color: 'red', fontSize: '1.5rem', fontWeight: 'bold' }}>Access Denied</h1>
        <p>You do not have permission to view Financial Reports.</p>
      </div>
    )
  }

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
        <ExportButton data={exportData} filename="financial_reports_export.csv" className={styles.exportBtn} />
      </div>

      <div className={styles.summaryCards}>
        <div className={styles.card}>
          <h3>Total Revenue (Accounts)</h3>
          <p className={styles.cardValue}>₹{totalSales.toFixed(2)}</p>
        </div>
        <div className={styles.card}>
          <h3>Total Tax Collected</h3>
          <p className={styles.cardValue}>₹{totalTax.toFixed(2)}</p>
        </div>
        <div className={styles.card}>
          <h3>Total Transactions</h3>
          <p className={styles.cardValue}>{sales?.length || 0}</p>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Product Code (SKU)</th>
              <th>Amount (Accounts)</th>
              <th>Tax Rate</th>
              <th>Payment Mode</th>
            </tr>
          </thead>
          <tbody>
            {sales?.map(sale => (
              <tr key={sale.sale_id}>
                <td>{new Date(sale.sale_date).toLocaleString()}</td>
                <td>{sale.product_code}</td>
                <td><strong>₹{getAccountPrice(sale)}</strong></td>
                <td>{sale.tax_rate}%</td>
                <td>
                  <span className={`${styles.badge} ${sale.payment_mode === 'UPI' ? styles.badgeUpi : styles.badgeCash}`}>
                    {sale.payment_mode}
                  </span>
                </td>
              </tr>
            ))}
            {(!sales || sales.length === 0) && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No sales recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
