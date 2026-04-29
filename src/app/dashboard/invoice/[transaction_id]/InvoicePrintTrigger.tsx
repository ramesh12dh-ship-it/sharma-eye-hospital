'use client'

import { useEffect } from 'react'

export default function InvoicePrintTrigger() {
  useEffect(() => {
    // Small delay to let fonts/images load before print dialog
    const timer = setTimeout(() => window.print(), 800)
    return () => clearTimeout(timer)
  }, [])

  return null
}
