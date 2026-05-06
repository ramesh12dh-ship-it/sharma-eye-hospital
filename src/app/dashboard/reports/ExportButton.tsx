'use client'

import Papa from 'papaparse'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'

export default function ExportButton({
  data, filename,
}: { data: Record<string, string | number>[]; filename: string; className?: string }) {
  const handleExport = () => {
    if (!data || data.length === 0) return toast.info('No data to export')
    const blob = new Blob([Papa.unparse(data)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Button onClick={handleExport} variant="secondary" size="sm">
      <Download size={14} /> Export CSV
    </Button>
  )
}
