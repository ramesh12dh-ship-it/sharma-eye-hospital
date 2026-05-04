import type { Metadata } from 'next'
import { PublicHomePage, publicContent } from '@/components/public/PublicHomePage'

export const metadata: Metadata = {
  title: { absolute: publicContent.hi.title },
  description: publicContent.hi.description,
  alternates: {
    canonical: '/hi',
    languages: {
      en: '/',
      hi: '/hi',
      pa: '/pa',
    },
  },
}

export default function HindiHomePage() {
  return <PublicHomePage locale="hi" />
}
