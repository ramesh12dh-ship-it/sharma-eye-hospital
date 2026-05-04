import type { Metadata } from 'next'
import { PublicHomePage, publicContent } from '@/components/public/PublicHomePage'

export const metadata: Metadata = {
  title: { absolute: publicContent.pa.title },
  description: publicContent.pa.description,
  alternates: {
    canonical: '/pa',
    languages: {
      en: '/',
      hi: '/hi',
      pa: '/pa',
    },
  },
}

export default function PunjabiHomePage() {
  return <PublicHomePage locale="pa" />
}
