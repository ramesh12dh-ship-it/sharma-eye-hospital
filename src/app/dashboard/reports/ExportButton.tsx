'use client'

import Papa from 'papaparse'

export default function ExportButton({ data, filename, className }: { data: any[], filename: string, className?: string }) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      return alert('No data to export.')
    }

    const csvContent = Papa.unparse(data)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <button onClick={handleExport} className={className}>
      Export Report CSV
    </button>
  )
}
