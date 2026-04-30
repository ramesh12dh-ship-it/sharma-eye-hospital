'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteSale } from './actions'
import { toast } from '@/components/ui/Toast'

export default function DeleteSaleButton({ saleId }: { saleId: string }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete this sale? Inventory stock will be restored.')) return
    setIsDeleting(true)
    const result = await deleteSale(saleId)
    setIsDeleting(false)
    if (result?.error) {
      toast.error('Could not delete sale', result.error)
    } else {
      toast.success('Sale deleted, stock restored')
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] font-medium text-coral-600 transition-colors hover:bg-coral-50 disabled:opacity-50"
    >
      <Trash2 size={13} />
      {isDeleting ? 'Deleting…' : 'Delete'}
    </button>
  )
}
