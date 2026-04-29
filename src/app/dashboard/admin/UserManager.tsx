'use client'

import React, { useState } from 'react'
import { addRole, removeRole } from './actions'

type UserProfile = {
  user_id: string
  email: string
  roles: string[]
}

const AVAILABLE_ROLES = ['admin', 'store_manager', 'receptionist', 'optician', 'accountant', 'doctor']

export default function UserManager({ users }: { users: UserProfile[] }) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderBottom: '1px solid #fecaca' }}>
          {error}
          <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
        </div>
      )}
      
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>User Email</th>
            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>Current Roles</th>
            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#4b5563' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.user_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '1rem', fontWeight: 500 }}>{user.email}</td>
              <td style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {user.roles.map(role => (
                    <span key={role} style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.375rem', 
                      padding: '0.25rem 0.625rem', 
                      borderRadius: '9999px', 
                      fontSize: '0.75rem', 
                      fontWeight: 600, 
                      backgroundColor: role === 'admin' ? '#dbeafe' : '#f3f4f6', 
                      color: role === 'admin' ? '#1e40af' : '#374151' 
                    }}>
                      {role.replace('_', ' ')}
                      <button 
                        onClick={() => handleRemoveRole(user.user_id, role)}
                        disabled={!!isUpdating}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: '#9ca3af', fontWeight: 'bold', fontSize: '1rem' }}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </td>
              <td style={{ padding: '1rem', textAlign: 'right' }}>
                <select 
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddRole(user.user_id, user.email, e.target.value)
                      e.target.value = ''
                    }
                  }}
                  disabled={!!isUpdating}
                  style={{ padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                >
                  <option value="">+ Add Role</option>
                  {AVAILABLE_ROLES.filter(r => !user.roles.includes(r)).map(role => (
                    <option key={role} value={role}>{role.replace('_', ' ')}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
