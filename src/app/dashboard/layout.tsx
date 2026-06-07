import { getAuthUser, getUserRoles } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SidebarNav } from '@/components/nav/SidebarNav'
import { Toaster } from '@/components/ui/Toast'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, userRoles] = await Promise.all([getAuthUser(), getUserRoles()])
  if (!user) redirect('/login')

  if (userRoles.length === 0) {
    redirect('/login?message=Staff access required. Ask an admin to assign a role.')
  }

  return (
    // CSS Grid: sidebar reserves column 1 (244px) at lg+, single column on
    // smaller screens. `isolation: isolate` creates a stable stacking context
    // so the sidebar's compositing layer is predictable across browsers.
    <div className="relative grid min-h-dvh isolate lg:grid-cols-[244px_1fr]">
      <SidebarNav userRoles={userRoles} userEmail={user.email ?? ''} />

      <main className="min-w-0">
        <div className="animate-fade-in mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          {children}
        </div>
      </main>

      <Toaster />
    </div>
  )
}
