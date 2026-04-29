'use client'

import React, { useState } from 'react'
import { addRole, removeRole, createFullUser, deleteFullUser } from './actions'

type UserProfile = {
  user_id: string
  email: string
  roles: string[]
}

const AVAILABLE_ROLES = ['admin', 'store_manager', 'receptionist', 'optician', 'accountant', 'doctor']

export default function UserManager({ users }: { users: UserProfile[] }) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Create user form state
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
    if (!confirm(`PERMANENTLY delete user ${email}? This cannot be undone.`)) return
    
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
    setIsUpdating(`${userId}-${role}`)
    const result = await removeRole(userId, role)
    if (result.error) setError(result.error)
    setIsUpdating(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0 }}>Active Users</h2>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{ 
            backgroundColor: showCreateForm ? '#6b7280' : '#2563eb', 
            color: 'white', 
            border: 'none', 
            padding: '0.5rem 1rem', 
            borderRadius: '0.375rem', 
            cursor: 'pointer', 
            fontWeight: 600, 
            fontSize: '0.875rem' 
          }}
        >
          {showCreateForm ? 'Cancel' : '+ Create New User'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateUser} style={{ 
          backgroundColor: '#f9fafb', 
          border: '1px solid #e5e7eb', 
          padding: '1.5rem', 
          borderRadius: '0.5rem', 
          marginBottom: '2rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr auto',
          gap: '1rem',
          alignItems: 'flex-end'
        }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', display: 'block', marginBottom: '0.375rem' }}>Email</label>
            <input 
              type="email" 
              required 
              value={newEmail} 
              onChange={e => setNewEmail(e.target.value)} 
              placeholder="staff@sharmaeye.com"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', display: 'block', marginBottom: '0.375rem' }}>Temp Password</label>
            <input 
              type="text" 
              required 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              placeholder="Min 6 chars"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', display: 'block', marginBottom: '0.375rem' }}>Initial Role</label>
            <select 
              value={newRole} 
              onChange={e => setNewRole(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
            >
              {AVAILABLE_ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
          </div>
          <button 
            type="submit" 
            disabled={isUpdating === 'creating'}
            style={{ backgroundColor: '#059669', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 600 }}
          >
            {isUpdating === 'creating' ? 'Creating...' : 'Create'}
          </button>
        </form>
      )}

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          {error}
          <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
        </div>
      )}
      
      <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563', fontSize: '0.875rem' }}>User Email</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563', fontSize: '0.875rem' }}>Current Roles</th>
              <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#4b5563', fontSize: '0.875rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.user_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user.email}</div>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontFamily: 'monospace' }}>{user.user_id}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {user.roles.map(role => (
                      <span key={role} style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.375rem', 
                        padding: '0.25rem 0.625rem', 
                        borderRadius: '9999px', 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        backgroundColor: role === 'admin' ? '#dbeafe' : '#f3f4f6', 
                        color: role === 'admin' ? '#1e40af' : '#374151',
                        textTransform: 'uppercase'
                      }}>
                        {role.replace('_', ' ')}
                        <button 
                          onClick={() => handleRemoveRole(user.user_id, role)}
                          disabled={!!isUpdating}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: '#9ca3af', fontWeight: 'bold' }}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <select 
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddRole(user.user_id, user.email, e.target.value)
                          e.target.value = ''
                        }
                      }}
                      disabled={!!isUpdating}
                      style={{ padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                    >
                      <option value="">+ Role</option>
                      {AVAILABLE_ROLES.filter(r => !user.roles.includes(r)).map(role => (
                        <option key={role} value={role}>{role.replace('_', ' ')}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => handleDeleteUser(user.user_id, user.email)}
                      disabled={!!isUpdating}
                      style={{ 
                        padding: '0.4rem 0.6rem', 
                        backgroundColor: 'white', 
                        color: '#ef4444', 
                        border: '1px solid #fecaca', 
                        borderRadius: '0.375rem', 
                        cursor: 'pointer', 
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}
                    >
                      Delete User
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
