import type { Metadata } from 'next'
import { CataractSurgeryPage, cataractContent } from '@/components/public/CataractSurgeryPage'

export const metadata: Metadata = {
  title: { absolute: cataractContent.en.title },
  description: cataractContent.en.description,
  alternates: {
    canonical: '/cataract-surgery',
    languages: {
      en: '/cataract-surgery',
      hi: '/hi/cataract-surgery',
      pa: '/pa/cataract-surgery',
    },
  },
}

export default function CataractPage() {
  return <CataractSurgeryPage locale="en" />
}
