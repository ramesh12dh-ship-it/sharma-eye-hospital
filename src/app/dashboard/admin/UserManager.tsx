'use client'

import React, { useState } from 'react'
import { X, ShieldCheck, UserPlus, Trash2 } from 'lucide-react'
import { addRole, removeRole, createFullUser, deleteFullUser } from './actions'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input, Select, Label } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { TableShell, TableScroll, Table, Thead, Th, Tr, Td, TableEmpty } from '@/components/ui/Table'
import { roleLabel } from '@/utils/roles'
import { cn } from '@/lib/utils'

type UserProfile = {
  user_id: string
  email: string
  roles: string[]
}

const AVAILABLE_ROLES = ['admin', 'store_manager', 'receptionist', 'optician', 'accountant', 'doctor']

const ROLE_TONE: Record<string, 'brand' | 'success' | 'warn' | 'neutral'> = {
  admin: 'brand',
  optician: 'success',
  receptionist: 'warn',
  accountant: 'neutral',
  store_manager: 'neutral',
  doctor: 'neutral',
}

export default function UserManager({ users }: { users: UserProfile[] }) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('receptionist')

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating('creating')
    setError(null)
    const result = await createFullUser(newEmail, newPassword, newRole)
    if (result.error) {
      setError(result.error)
    } else {
      setNewEmail('')
      setNewPassword('')
      setShowCreateForm(false)
    }
    setIsUpdating(null)
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Permanently delete ${email}? This cannot be undone.`)) return
    setIsUpdating(`deleting-${userId}`)
    const result = await deleteFullUser(userId)
    if (result.error) setError(result.error)
    setIsUpdating(null)
  }

  const handleAddRole = async (userId: string, email: string, role: string) => {
    setIsUpdating(`${userId}-${role}`)
    const result = await addRole(userId, email, role)
    if (result.error) setError(result.error)
    setIsUpdating(null)
  }

  const handleRemoveRole = async (userId: string, role: string) => {
    if (role === 'admin' && users.find(u => u.user_id === userId)?.roles.length === 1) {
      if (!confirm('This is the only role for this user. Are you sure?')) return
    }
    setIsUpdating(`${userId}-${role}`)
    const result = await removeRole(userId, role)
    if (result.error) setError(result.error)
    setIsUpdating(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold tracking-tight text-ink-900">Active users</h2>
        <Button
          size="sm"
          variant={showCreateForm ? 'secondary' : 'primary'}
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? <X size={14} /> : <UserPlus size={14} />}
          {showCreateForm ? 'Cancel' : 'Create user'}
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create a new user</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleCreateUser}
              className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_180px_auto] md:items-end"
            >
              <div className="flex flex-col gap-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="staff@sharmaeye.com"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Temporary password</Label>
                <Input
                  type="text"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Initial role</Label>
                <Select value={newRole} onChange={e => setNewRole(e.target.value)}>
                  {AVAILABLE_ROLES.map(r => (
                    <option key={r} value={r}>{roleLabel(r)}</option>
                  ))}
                </Select>
              </div>
              <Button type="submit" disabled={isUpdating === 'creating'} className="md:self-end">
                {isUpdating === 'creating' ? 'Creating…' : 'Create'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-coral-200 bg-coral-50 px-4 py-3 text-[13px] text-coral-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="rounded-md p-0.5 hover:bg-white/50">
            <X size={14} />
          </button>
        </div>
      )}

      <TableShell>
        <TableScroll>
          <Table minWidth={780}>
            <Thead>
              <tr>
                <Th>User</Th>
                <Th>Roles</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </Thead>
            <tbody>
              {users.length === 0 && (
                <TableEmpty colSpan={3} message="No users yet." />
              )}
              {users.map(user => (
                <Tr key={user.user_id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[13px] font-semibold text-brand-700">
                        {user.email.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-ink-900">{user.email}</div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          {user.roles.includes('admin') && (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-brand-600">
                              <ShieldCheck size={10} /> Admin
                            </span>
                          )}
                          <span className="font-mono text-[10px] text-ink-400 truncate" title={user.user_id}>
                            {user.user_id.slice(0, 8)}…
                          </span>
                        </div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      {user.roles.length === 0 && (
                        <span className="text-[12px] italic text-ink-400">No roles assigned</span>
                      )}
                      {user.roles.map(role => (
                        <Badge key={role} tone={ROLE_TONE[role] ?? 'neutral'}>
                          <span>{roleLabel(role)}</span>
                          <button
                            onClick={() => handleRemoveRole(user.user_id, role)}
                            disabled={!!isUpdating}
                            className={cn(
                              '-mr-0.5 ml-0.5 rounded-full p-0.5 transition-colors hover:bg-white/40',
                              isUpdating && 'cursor-not-allowed opacity-50',
                            )}
                            aria-label={`Remove ${role}`}
                          >
                            <X size={11} />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Select
                        onChange={e => {
                          if (e.target.value) {
                            handleAddRole(user.user_id, user.email, e.target.value)
                            e.target.value = ''
                          }
                        }}
                        disabled={!!isUpdating}
                        defaultValue=""
                        className="h-8 max-w-[140px] text-[12.5px]"
                      >
                        <option value="">+ Role</option>
                        {AVAILABLE_ROLES.filter(r => !user.roles.includes(r)).map(role => (
                          <option key={role} value={role}>{roleLabel(role)}</option>
                        ))}
                      </Select>
                      <button
                        onClick={() => handleDeleteUser(user.user_id, user.email)}
                        disabled={!!isUpdating}
                        className="inline-flex items-center gap-1 rounded-md border border-coral-200 bg-white px-2.5 py-1 text-[12px] font-medium text-coral-600 transition-colors hover:bg-coral-50 disabled:opacity-50"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableScroll>
      </TableShell>
    </div>
  )
}
