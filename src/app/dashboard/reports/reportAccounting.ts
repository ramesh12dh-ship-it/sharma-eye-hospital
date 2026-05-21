export type ReportAccountingSale = {
  product_code: string
  sale_date: string
  payment_mode: string
  tax_rate: number
  sale_amount: number | null
  is_voided: boolean
  products: { sale_price_a: number | null } | null
  patients: { name: string; phone: string } | null
}

export function getReportSaleAmount(sale: Pick<ReportAccountingSale, 'sale_amount'>) {
  return Number(sale.sale_amount || 0)
}

export function calculateReportTotals(sales: ReportAccountingSale[]) {
  const live = sales.filter(sale => !sale.is_voided)

  return {
    totalSales: live.reduce((acc, sale) => acc + getReportSaleAmount(sale), 0),
    totalTax: live.reduce(
      (acc, sale) => acc + (getReportSaleAmount(sale) * Number(sale.tax_rate)) / 100,
      0,
    ),
    transactionCount: live.length,
  }
}

export function buildReportExportData(sales: ReportAccountingSale[]) {
  return sales.map(sale => ({
    Date: new Date(sale.sale_date).toLocaleString(),
    'Product Code': sale.product_code,
    Patient: sale.patients?.name ?? '',
    Phone: sale.patients?.phone ?? '',
    'Payment Mode': sale.payment_mode,
    'Tax Rate (%)': sale.tax_rate,
    'Sale amount': getReportSaleAmount(sale),
    Voided: sale.is_voided ? 'Yes' : 'No',
  }))
}
