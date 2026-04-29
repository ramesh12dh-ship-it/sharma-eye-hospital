'use client'

import React, { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { formatDate, formatDateTime } from '@/utils/date'

type Patient = {
  patient_id: string
  name: string
  phone: string
  age: number | null
  address: string | null
  created_at: string
}

type Prescription = {
  prescription_id: string
  created_at: string
  r_sph: number | null; r_cyl: number | null; r_axis: number | null; r_add: number | null
  l_sph: number | null; l_cyl: number | null; l_axis: number | null; l_add: number | null
  pd: number | null
  document_path: string | null
  notes: string | null
}

type Sale = {
  sale_id: string
  sale_date: string
  product_code: string
  sale_amount: number
  tax_rate: number
  payment_mode: string
  transaction_id: string | null
}

type OpticalOrder = {
  order_id: string
  status: 'ordered' | 'in_workshop' | 'ready' | 'delivered' | 'cancelled'
  expected_date: string | null
  notes: string | null
  created_at: string
}

type Props = {
  patient: Patient
  prescriptions: Prescription[]
  sales: Sale[]
  orders: OpticalOrder[]
  canWrite: boolean
  userId: string
}

// Format eye power into a compact string
function eyeStr(sph: number | null, cyl: number | null, axis: number | null, add: number | null) {
  if (sph == null && cyl == null) return null
  const s = sph != null ? (sph >= 0 ? `+${sph.toFixed(2)}` : sph.toFixed(2)) : '—'
  const c = cyl != null ? (cyl >= 0 ? `+${cyl.toFixed(2)}` : cyl.toFixed(2)) : '—'
  const a = axis != null ? ` × ${axis}°` : ''
  const ad = add != null ? `  ADD: +${add.toFixed(2)}` : ''
  return `${s} / ${c}${a}${ad}`
}

const emptyRx = { r_sph: '', r_cyl: '', r_axis: '', r_add: '', l_sph: '', l_cyl: '', l_axis: '', l_add: '', pd: '', notes: '' }

export default function PatientFile({ patient, prescriptions: initialPrescriptions, sales, orders, canWrite, userId }: Props) {
  const supabase = createClient()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions)
  const [isAddingRx, setIsAddingRx] = useState(false)
  const [rxForm, setRxForm] = useState(emptyRx)
  const [rxFile, setRxFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const setField = (field: keyof typeof emptyRx, val: string) =>
    setRxForm(prev => ({ ...prev, [field]: val }))

  const openDocumentUrl = async (path: string) => {
    const { data } = await supabase.storage.from('prescriptions').createSignedUrl(path, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const handleSubmitRx = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setFeedback(null)

    const payload = {
      patient_id: patient.patient_id,
      recorded_by: userId,
      r_sph: rxForm.r_sph ? parseFloat(rxForm.r_sph) : null,
      r_cyl: rxForm.r_cyl ? parseFloat(rxForm.r_cyl) : null,
      r_axis: rxForm.r_axis ? parseInt(rxForm.r_axis) : null,
      r_add: rxForm.r_add ? parseFloat(rxForm.r_add) : null,
      l_sph: rxForm.l_sph ? parseFloat(rxForm.l_sph) : null,
      l_cyl: rxForm.l_cyl ? parseFloat(rxForm.l_cyl) : null,
      l_axis: rxForm.l_axis ? parseInt(rxForm.l_axis) : null,
      l_add: rxForm.l_add ? parseFloat(rxForm.l_add) : null,
      pd: rxForm.pd ? parseFloat(rxForm.pd) : null,
      notes: rxForm.notes || null,
    }

    const { data: newRx, error } = await supabase
      .from('prescriptions').insert(payload).select().single()

    if (error || !newRx) {
      setFeedback({ type: 'error', text: 'Could not save prescription.' })
      setIsSaving(false)
      return
    }

    let document_path: string | null = null
    if (rxFile) {
      const ext = rxFile.name.split('.').pop()
      const storagePath = `${patient.patient_id}/${newRx.prescription_id}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('prescriptions').upload(storagePath, rxFile, { upsert: true })

      if (!uploadError) {
        document_path = storagePath
        await supabase.from('prescriptions').update({ document_path }).eq('prescription_id', newRx.prescription_id)
      }
    }

    setPrescriptions([{ ...newRx, document_path }, ...prescriptions])
    setRxForm(emptyRx)
    setRxFile(null)
    setIsAddingRx(false)
    setFeedback({ type: 'success', text: 'Prescription saved.' })
    setIsSaving(false)
  }

  const handleDeleteRx = async (rxId: string, docPath: string | null) => {
    if (!confirm('Are you sure you want to delete this prescription?')) return
    setIsSaving(true)
    if (docPath) await supabase.storage.from('prescriptions').remove([docPath])
    const { error } = await supabase.from('prescriptions').delete().eq('prescription_id', rxId)
    if (error) {
      setFeedback({ type: 'error', text: 'Could not delete.' })
    } else {
      setPrescriptions(prescriptions.filter(p => p.prescription_id !== rxId))
      setFeedback({ type: 'success', text: 'Prescription deleted.' })
    }
    setIsSaving(false)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, any> = {
      ordered: { bg: '#fef3c7', text: '#92400e' },
      in_workshop: { bg: '#ffedd5', text: '#9a3412' },
      ready: { bg: '#dcfce7', text: '#166534' },
      delivered: { bg: '#dbeafe', text: '#1e40af' },
      cancelled: { bg: '#fee2e2', text: '#991b1b' },
    }
    const s = styles[status] || { bg: '#f3f4f6', text: '#374151' }
    return <span style={{ padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: s.bg, color: s.text, textTransform: 'uppercase' }}>{status.replace('_', ' ')}</span>
  }

  const card: React.CSSProperties = { backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '1.5rem' }
  const label: React.CSSProperties = { fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }
  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', fontSize: '0.9rem' }
  const eyeInputStyle: React.CSSProperties = { width: '100%', padding: '0.35rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', fontSize: '0.85rem', textAlign: 'center' }

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled')

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <a href="/dashboard/patients" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '1.25rem' }}>← Back to Patients</a>

      <div style={{ ...card, background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>{patient.name}</h1>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.9 }}>
              <span>📞 {patient.phone}</span>
              {patient.age && <span>🎂 {patient.age} yrs</span>}
              {patient.address && <span>📍 {patient.address}</span>}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.8rem', opacity: 0.8 }}>
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>{prescriptions.length} Prescriptions</div>
            <div>{sales.length} Purchases</div>
          </div>
        </div>
      </div>

      {feedback && <div style={{ padding: '0.625rem 1rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem', backgroundColor: feedback.type === 'success' ? '#dcfce7' : '#fee2e2', color: feedback.type === 'success' ? '#166534' : '#b91c1c' }}>{feedback.text}</div>}

      {/* ACTIVE ORDERS */}
      {activeOrders.length > 0 && (
        <div style={{ ...card, border: '2px solid #bfdbfe' }}>
           <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 1rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <span style={{ fontSize: '1.25rem' }}>🕶️</span> Active Optical Orders
           </h2>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
             {activeOrders.map(order => (
               <div key={order.order_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#f0f7ff', borderRadius: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                       {getStatusBadge(order.status)}
                       <span style={{ fontSize: '0.875rem', color: '#1e3a8a', fontWeight: 500 }}>
                         Due: {order.expected_date ? formatDate(order.expected_date) : 'N/A'}
                       </span>
                    </div>
                    {order.notes && <p style={{ margin: '0.375rem 0 0', fontSize: '0.8rem', color: '#4b5563' }}>{order.notes}</p>}
                  </div>
                  <a href="/dashboard/orders" style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Track →</a>
               </div>
             ))}
           </div>
        </div>
      )}

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Prescriptions</h2>
          {canWrite && !isAddingRx && <button onClick={() => setIsAddingRx(true)} style={{ backgroundColor: '#1d4ed8', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>+ New Prescription</button>}
        </div>

        {isAddingRx && (
          <form onSubmit={handleSubmitRx} style={{ backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <thead><tr style={{ backgroundColor: '#e2e8f0' }}><th>Eye</th><th>SPH</th><th>CYL</th><th>AXIS</th><th>ADD</th></tr></thead>
                <tbody>
                  <tr><td style={{ fontWeight: 700, color: '#1d4ed8' }}>RE</td><td><input type="number" step="0.25" placeholder="+0.00" value={rxForm.r_sph} onChange={e => setField('r_sph', e.target.value)} style={eyeInputStyle} /></td><td><input type="number" step="0.25" placeholder="0.00" value={rxForm.r_cyl} onChange={e => setField('r_cyl', e.target.value)} style={eyeInputStyle} /></td><td><input type="number" min="0" max="180" placeholder="0" value={rxForm.r_axis} onChange={e => setField('r_axis', e.target.value)} style={eyeInputStyle} /></td><td><input type="number" step="0.25" placeholder="+0.00" value={rxForm.r_add} onChange={e => setField('r_add', e.target.value)} style={eyeInputStyle} /></td></tr>
                  <tr style={{ backgroundColor: '#f1f5f9' }}><td style={{ fontWeight: 700, color: '#1d4ed8' }}>LE</td><td><input type="number" step="0.25" placeholder="+0.00" value={rxForm.l_sph} onChange={e => setField('l_sph', e.target.value)} style={eyeInputStyle} /></td><td><input type="number" step="0.25" placeholder="0.00" value={rxForm.l_cyl} onChange={e => setField('l_cyl', e.target.value)} style={eyeInputStyle} /></td><td><input type="number" min="0" max="180" placeholder="0" value={rxForm.l_axis} onChange={e => setField('l_axis', e.target.value)} style={eyeInputStyle} /></td><td><input type="number" step="0.25" placeholder="+0.00" value={rxForm.l_add} onChange={e => setField('l_add', e.target.value)} style={eyeInputStyle} /></td></tr>
                </tbody>
              </table>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div><div style={label}>PD (mm)</div><input type="number" step="0.5" placeholder="62.0" value={rxForm.pd} onChange={e => setField('pd', e.target.value)} style={inputStyle} /></div>
              <div><div style={label}>Notes</div><input type="text" placeholder="e.g. Bifocal..." value={rxForm.notes} onChange={e => setField('notes', e.target.value)} style={inputStyle} /></div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={label}>Upload Prescription Slip</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.875rem', border: '1.5px dashed #cbd5e1', borderRadius: '0.375rem', cursor: 'pointer', backgroundColor: rxFile ? '#f0fdf4' : 'white', fontSize: '0.875rem' }}>
                <span>{rxFile ? '✅' : '📎'}</span><span>{rxFile ? rxFile.name : 'Click to attach photo or PDF'}</span>
                <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => setRxFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}><button type="submit" disabled={isSaving} style={{ backgroundColor: '#1d4ed8', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>{isSaving ? 'Saving…' : 'Save Prescription'}</button><button type="button" onClick={() => { setIsAddingRx(false); setRxForm(emptyRx); setRxFile(null) }} style={{ backgroundColor: 'white', color: '#6b7280', border: '1px solid #d1d5db', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button></div>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {prescriptions.map(rx => {
            const re = eyeStr(rx.r_sph, rx.r_cyl, rx.r_axis, rx.r_add)
            const le = eyeStr(rx.l_sph, rx.l_cyl, rx.l_axis, rx.l_add)
            
            return (
              <div key={rx.prescription_id} style={{ border: '1px solid #e5e7eb', borderRadius: '0.375rem', padding: '0.875rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{formatDate(rx.created_at)}</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {rx.document_path && (
                      <button onClick={() => openDocumentUrl(rx.document_path!)} style={{ fontSize: '0.75rem', color: '#2563eb', background: 'none', border: '1px solid #bfdbfe', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }}>📄 Slip</button>
                    )}
                    {canWrite && (
                      <button onClick={() => handleDeleteRx(rx.prescription_id, rx.document_path)} style={{ fontSize: '0.75rem', color: '#dc2626', background: 'none', border: '1px solid #fecaca', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }}>🗑</button>
                    )}
                  </div>
                </div>
                {re && (
                  <div style={{ fontSize: '0.875rem', marginTop: '0.375rem' }}>
                    <span style={{ fontWeight: 700, color: '#1d4ed8', marginRight: '0.5rem' }}>RE</span>
                    {re}
                  </div>
                )}
                {le && (
                  <div style={{ fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: 700, color: '#1d4ed8', marginRight: '0.5rem' }}>LE</span>
                    {le}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div style={card}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 1rem' }}>Purchase History</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead><tr style={{ backgroundColor: '#f9fafb' }}><th style={{ padding: '0.5rem', textAlign: 'left' }}>Date</th><th style={{ padding: '0.5rem', textAlign: 'left' }}>Product</th><th style={{ padding: '0.5rem', textAlign: 'right' }}>Amount</th><th style={{ padding: '0.5rem', textAlign: 'left' }}>Payment</th><th style={{ padding: '0.5rem', textAlign: 'left' }}>Invoice</th></tr></thead>
            <tbody>
              {sales.map((s, i) => (
                <tr key={s.sale_id} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                  <td style={{ padding: '0.5rem', color: '#6b7280' }}>{formatDate(s.sale_date)}</td>
                  <td style={{ padding: '0.5rem', fontWeight: 500 }}>{s.product_code}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>₹{Number(s.sale_amount).toFixed(2)}</td>
                  <td style={{ padding: '0.5rem' }}>{s.payment_mode}</td>
                  <td style={{ padding: '0.5rem' }}>{s.transaction_id ? <a href={`/dashboard/invoice/${s.transaction_id}`} target="_blank" style={{ color: '#2563eb', textDecoration: 'none' }}>🖨</a> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
