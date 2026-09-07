import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui/PageHeader'
import { PhotoStampGenerator } from './PhotoStampGenerator'

export const metadata: Metadata = {
  title: 'Photo stamp',
  description: 'Add the hospital location strip to patient photographs.',
}

export default function PhotoStampPage() {
  return (
    <div>
      <PageHeader
        title="Photo stamp"
        description="Add the Sharma Eye Hospital location strip to a photo, then download the finished image."
      />
      <PhotoStampGenerator />
    </div>
  )
}
