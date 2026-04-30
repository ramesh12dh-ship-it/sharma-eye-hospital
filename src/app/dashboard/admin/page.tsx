import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { hasRole } from '@/utils/roles'
import UserManager from './UserManager'
import { PageHeader } from '@/components/ui/PageHeader'
import { AccessDenied } from '@/components/ui/AccessDenied'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const userRoles = roleData?.map(r => r.role) ?? []

  if (!hasRole(userRoles, 'admin')) {
    return <AccessDenied resource="Admin tools" />
  }

  const { data: allRoles } = await supabase
    .from('user_roles')
    .select('*')
    .order('email', { ascending: true })

  const usersMap: Record<string, { user_id: string; email: string; roles: string[] }> = {}
  allRoles?.forEach(row => {
    if (!usersMap[row.user_id]) {
      usersMap[row.user_id] = { user_id: row.user_id, email: row.email, roles: [] }
    }
    usersMap[row.user_id].roles.push(row.role)
  })
  const users = Object.values(usersMap)

  return (
    <div>
      <PageHeader
        title="User management"
        description="Add or remove role assignments for staff."
      />
      <UserManager users={users} />
    </div>
  )
}
