import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { hasRole } from '@/utils/roles'
import UserManager from './UserManager'

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
    redirect('/dashboard')
  }

  // Fetch all user roles to list users
  const { data: allRoles } = await supabase
    .from('user_roles')
    .select('*')
    .order('email', { ascending: true })

  // Group by user_id
  const usersMap: Record<string, { user_id: string, email: string, roles: string[] }> = {}
  
  allRoles?.forEach(row => {
    if (!usersMap[row.user_id]) {
      usersMap[row.user_id] = { user_id: row.user_id, email: row.email, roles: [] }
    }
    usersMap[row.user_id].roles.push(row.role)
  })

  const users = Object.values(usersMap)

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>User Management</h1>
      
      <UserManager users={users} />
    </div>
  )
}
