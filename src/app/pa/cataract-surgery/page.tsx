import type { Metadata } from 'next'
import { CataractSurgeryPage, cataractContent } from '@/components/public/CataractSurgeryPage'

export const metadata: Metadata = {
  title: { absolute: cataractContent.pa.title },
  description: cataractContent.pa.description,
  alternates: {
    canonical: '/pa/cataract-surgery',
    languages: {
      en: '/cataract-surgery',
      hi: '/hi/cataract-surgery',
      pa: '/pa/cataract-surgery',
    },
  },
}

export default function PunjabiCataractPage() {
  return <CataractSurgeryPage locale="pa" />
}
