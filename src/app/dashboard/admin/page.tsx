import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { hasRole, roleLabel } from '@/utils/roles'
import UserManager from './UserManager'
import { PageHeader } from '@/components/ui/PageHeader'
import { AccessDenied } from '@/components/ui/AccessDenied'
import { TableShell, TableScroll, Table, Thead, Th, Tr, Td } from '@/components/ui/Table'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
      <RoleAccessReference />
    </div>
  )
}

// ─── Role access reference ──────────────────────────────────────────
// Static reference for what each role can do. Lives at the bottom of
// the admin page so it's available without dominating the layout.
// Admin always implicitly inherits every other role's access.
const MODULES = ['Inventory', 'POS', 'Patients', 'Orders', 'Reports', 'Admin'] as const
type Module = typeof MODULES[number]

const ROLE_ACCESS: Record<string, Record<Module, string>> = {
  admin:         { Inventory: 'Full', POS: 'Full', Patients: 'Full',     Orders: 'Full',          Reports: 'Full', Admin: 'Full' },
  store_manager: { Inventory: 'Full', POS: 'Full', Patients: 'View',     Orders: 'Edit',          Reports: '—',    Admin: '—' },
  receptionist:  { Inventory: '—',    POS: 'Full', Patients: 'Full',     Orders: 'View · Create', Reports: '—',    Admin: '—' },
  optician:      { Inventory: '—',    POS: '—',    Patients: 'View · Rx', Orders: 'View',         Reports: '—',    Admin: '—' },
  accountant:    { Inventory: '—',    POS: '—',    Patients: 'View',     Orders: 'View',          Reports: 'View', Admin: '—' },
  doctor:        { Inventory: '—',    POS: '—',    Patients: '—',        Orders: '—',             Reports: '—',    Admin: '—' },
}

const ROLE_NOTE: Record<string, string> = {
  doctor: 'Reserved for future use — no access wired yet.',
}

function RoleAccessReference() {
  const roles = Object.keys(ROLE_ACCESS)
  return (
    <section className="mt-12">
      <div className="mb-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-500">
          Role access reference
        </h2>
        <p className="mt-1 text-[12.5px] text-ink-500">
          What each role can do per module. Admin inherits everything.
        </p>
      </div>
      <TableShell>
        <TableScroll>
          <Table minWidth={780}>
            <Thead>
              <tr>
                <Th>Role</Th>
                {MODULES.map(m => <Th key={m}>{m}</Th>)}
                <Th>Notes</Th>
              </tr>
            </Thead>
            <tbody>
              {roles.map(role => (
                <Tr key={role}>
                  <Td className="font-medium text-ink-900">{roleLabel(role)}</Td>
                  {MODULES.map(m => (
                    <Td key={m} className={ROLE_ACCESS[role][m] === '—' ? 'text-ink-300' : 'text-ink-700'}>
                      {ROLE_ACCESS[role][m]}
                    </Td>
                  ))}
                  <Td className="text-ink-500">{ROLE_NOTE[role] ?? ''}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableScroll>
      </TableShell>
    </section>
  )
}
