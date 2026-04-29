'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type Patient = {
  patient_id: string
  name: string
  phone: string
  age: number | null
  address: string | null
  created_at: string
}

export default function PatientsTable({ initialPatients, userRole }: { initialPatients: Patient[], userRole: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [patients, setPatients] = useState<Patient[]>(initialPatients)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    age: '',
    address: '',
  })

  const filteredPatients = useMemo(() => {
    const q = searchQuery.toLowerCase()
    if (!q) return patients
    return patients.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q)
    )
  }, [patients, searchQuery])

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFeedback(null)

    const { data, error } = await supabase
      .from('patients')
      .insert([{
        name: newPatient.name.trim(),
        phone: newPatient.phone.trim(),
        age: newPatient.age ? parseInt(newPatient.age) : null,
        address: newPatient.address.trim() || null,
      }])
      .select()
      .single()

    if (error) {
      if (error.message.includes('unique')) {
        setFeedback({ type: 'error', text: `A patient with phone number ${newPatient.phone} already exists.` })
      } else {
        setFeedback({ type: 'error', text: 'Could not save patient. Please try again.' })
      }
    } else if (data) {
      setPatients([data, ...patients])
      setFeedback({ type: 'success', text: `Patient "${data.name}" added successfully.` })
      setIsAdding(false)
      setNewPatient({ name: '', phone: '', age: '', address: '' })
    }
    setIsSubmitting(false)
  }

  const fieldStyle: React.CSSProperties = {
    padding: '0.625rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.9rem',
    width: '100%',
    color: '#111827',
    backgroundColor: 'white',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#4b5563',
    marginBottom: '0.25rem',
  }

  return (
    <div>
      {/* Feedback */}
      {feedback && (
        <div style={{
          padding: '0.875rem 1rem',
          marginBottom: '1rem',
          borderRadius: '0.375rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: feedback.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: feedback.type === 'success' ? '#065f46' : '#b91c1c',
        }}>
          {feedback.text}
          <button onClick={() => setFeedback(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', color: 'inherit' }}>&times;</button>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ ...fieldStyle, maxWidth: '320px' }}
        />
        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{filteredPatients.length} patients</div>
        {(userRole === 'admin' || userRole === 'receptionist') && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            style={{ marginLeft: 'auto', backgroundColor: isAdding ? '#6b7280' : '#2563eb', color: 'white', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer' }}
          >
            {isAdding ? 'Cancel' : '+ New Patient'}
          </button>
        )}
      </div>

      {/* Add Patient Form */}
      {isAdding && (
        <form onSubmit={handleAddPatient} style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 600, color: '#111827' }}>Add New Patient</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input required value={newPatient.name} onChange={e => setNewPatient({ ...newPatient, name: e.target.value })} style={fieldStyle} placeholder="e.g. Ramesh Sharma" />
            </div>
            <div>
              <label style={labelStyle}>Phone Number *</label>
              <input required value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} style={fieldStyle} placeholder="e.g. 9876543210" />
            </div>
            <div>
              <label style={labelStyle}>Age</label>
              <input type="number" min="0" max="120" value={newPatient.age} onChange={e => setNewPatient({ ...newPatient, age: e.target.value })} style={fieldStyle} placeholder="e.g. 45" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Address</label>
              <input value={newPatient.address} onChange={e => setNewPatient({ ...newPatient, address: e.target.value })} style={fieldStyle} placeholder="e.g. 12, MG Road, Nagpur" />
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} style={{ marginTop: '1.25rem', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer' }}>
            {isSubmitting ? 'Saving...' : 'Save Patient'}
          </button>
        </form>
      )}

      {/* Patients Table */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Name', 'Phone', 'Age', 'Address', 'Registered On'].map(h => (
                <th key={h} style={{ backgroundColor: '#f9fafb', fontWeight: 600, color: '#4b5563', padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map(p => (
              <tr key={p.patient_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#111827' }}>{p.name}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{p.phone}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{p.age ?? '—'}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#4b5563', maxWidth: '200px' }}>{p.address ?? '—'}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#6b7280', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {filteredPatients.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                  {searchQuery ? `No patients found matching "${searchQuery}"` : 'No patients registered yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
