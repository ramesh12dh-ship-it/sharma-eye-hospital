import type { Metadata } from 'next'
import { CataractSurgeryPage, cataractContent } from '@/components/public/CataractSurgeryPage'

export const metadata: Metadata = {
  title: { absolute: cataractContent.hi.title },
  description: cataractContent.hi.description,
  alternates: {
    canonical: '/hi/cataract-surgery',
    languages: {
      en: '/cataract-surgery',
      hi: '/hi/cataract-surgery',
      pa: '/pa/cataract-surgery',
    },
  },
}

export default function HindiCataractPage() {
  return <CataractSurgeryPage locale="hi" />
}
