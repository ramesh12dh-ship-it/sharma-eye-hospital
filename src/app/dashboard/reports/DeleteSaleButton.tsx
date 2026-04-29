'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteSale } from './actions'

export default function DeleteSaleButton({ saleId }: { saleId: string }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to void this sale? The inventory stock will automatically be restored.')) {
      return
    }

    setIsDeleting(true)
    const result = await deleteSale(saleId)
    
    setIsDeleting(false)
    
    if (result?.error) {
      alert(result.error)
    } else {
      router.refresh()
    }
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      style={{
        color: '#dc2626',
        background: 'none',
        border: 'none',
        cursor: isDeleting ? 'not-allowed' : 'pointer',
        fontWeight: 500,
        opacity: isDeleting ? 0.5 : 1
      }}
    >
      {isDeleting ? 'Voiding...' : 'Void Sale'}
    </button>
  )
}
