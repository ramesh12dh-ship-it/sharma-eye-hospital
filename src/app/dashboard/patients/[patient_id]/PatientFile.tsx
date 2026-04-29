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

type Props = {
  patient: Patient
  prescriptions: Prescription[]
  sales: Sale[]
  canWrite: boolean
  userId: string
}

// Format eye power into a compact string like "+1.25 / -0.50 × 90°"
function eyeStr(sph: number | null, cyl: number | null, axis: number | null, add: number | null) {
  if (sph == null && cyl == null) return null
  const s = sph != null ? (sph >= 0 ? `+${sph.toFixed(2)}` : sph.toFixed(2)) : '—'
  const c = cyl != null ? (cyl >= 0 ? `+${cyl.toFixed(2)}` : cyl.toFixed(2)) : '—'
  const a = axis != null ? ` × ${axis}°` : ''
  const ad = add != null ? `  ADD: +${add.toFixed(2)}` : ''
  return `${s} / ${c}${a}${ad}`
}

const emptyRx = { r_sph: '', r_cyl: '', r_axis: '', r_add: '', l_sph: '', l_cyl: '', l_axis: '', l_add: '', pd: '', notes: '' }

export default function PatientFile({ patient, prescriptions: initialPrescriptions, sales, canWrite, userId }: Props) {
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
      setFeedback({ type: 'error', text: 'Could not save prescription. Please try again.' })
      setIsSaving(false)
      return
    }

    // Upload file if selected
    let document_path: string | null = null
    if (rxFile) {
      const ext = rxFile.name.split('.').pop()
      const storagePath = `${patient.patient_id}/${newRx.prescription_id}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(storagePath, rxFile, { upsert: true })

      if (!uploadError) {
        document_path = storagePath
        await supabase.from('prescriptions')
          .update({ document_path })
          .eq('prescription_id', newRx.prescription_id)
      }
    }

    setPrescriptions([{ ...newRx, document_path }, ...prescriptions])
    setRxForm(emptyRx)
    setRxFile(null)
    setIsAddingRx(false)
    setFeedback({ type: 'success', text: 'Prescription saved.' })
    setIsSaving(false)
  }

  // --- Styles ---
  const card: React.CSSProperties = { backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '1.5rem' }
  const label: React.CSSProperties = { fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }
  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', fontSize: '0.9rem' }
  const eyeInputStyle: React.CSSProperties = { width: '100%', padding: '0.35rem 0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', fontSize: '0.85rem', textAlign: 'center' }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Back link */}
      <a href="/dashboard/patients" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '1.25rem' }}>
        ← Back to Patients
      </a>

      {/* Patient info card */}
      <div style={{ ...card, background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, letterSpacing: '-0.02em' }}>{patient.name}</h1>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.9 }}>
              <span>📞 {patient.phone}</span>
              {patient.age && <span>🎂 {patient.age} yrs</span>}
              {patient.address && <span>📍 {patient.address}</span>}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.375rem' }}>
              Patient since {formatDate(patient.created_at)}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.8rem', opacity: 0.8 }}>
            <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '2px' }}>{prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''}</div>
            <div>{sales.length} purchase{sales.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{ padding: '0.625rem 1rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem', backgroundColor: feedback.type === 'success' ? '#dcfce7' : '#fee2e2', color: feedback.type === 'success' ? '#166534' : '#b91c1c' }}>
          {feedback.text}
        </div>
      )}

      {/* ── Prescriptions ── */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Prescriptions</h2>
          {canWrite && !isAddingRx && (
            <button onClick={() => setIsAddingRx(true)}
              style={{ backgroundColor: '#1d4ed8', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
              + New Prescription
            </button>
          )}
        </div>

        {/* New Prescription Form */}
        {isAddingRx && (
          <form onSubmit={handleSubmitRx} style={{ backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', color: '#1e3a8a' }}>New Prescription</div>

            {/* Eye power table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e2e8f0' }}>
                    <th style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>Eye</th>
                    <th style={{ padding: '0.375rem 0.5rem', textAlign: 'center', fontWeight: 600, color: '#4b5563' }}>SPH</th>
                    <th style={{ padding: '0.375rem 0.5rem', textAlign: 'center', fontWeight: 600, color: '#4b5563' }}>CYL</th>
                    <th style={{ padding: '0.375rem 0.5rem', textAlign: 'center', fontWeight: 600, color: '#4b5563' }}>AXIS</th>
                    <th style={{ padding: '0.375rem 0.5rem', textAlign: 'center', fontWeight: 600, color: '#4b5563' }}>ADD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.375rem 0.5rem', fontWeight: 700, color: '#1d4ed8' }}>RE</td>
                    <td style={{ padding: '0.25rem' }}><input type="number" step="0.25" placeholder="+0.00" value={rxForm.r_sph} onChange={e => setField('r_sph', e.target.value)} style={eyeInputStyle} /></td>
                    <td style={{ padding: '0.25rem' }}><input type="number" step="0.25" placeholder="0.00" value={rxForm.r_cyl} onChange={e => setField('r_cyl', e.target.value)} style={eyeInputStyle} /></td>
                    <td style={{ padding: '0.25rem' }}><input type="number" min="0" max="180" placeholder="0" value={rxForm.r_axis} onChange={e => setField('r_axis', e.target.value)} style={eyeInputStyle} /></td>
                    <td style={{ padding: '0.25rem' }}><input type="number" step="0.25" placeholder="+0.00" value={rxForm.r_add} onChange={e => setField('r_add', e.target.value)} style={eyeInputStyle} /></td>
                  </tr>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <td style={{ padding: '0.375rem 0.5rem', fontWeight: 700, color: '#1d4ed8' }}>LE</td>
                    <td style={{ padding: '0.25rem' }}><input type="number" step="0.25" placeholder="+0.00" value={rxForm.l_sph} onChange={e => setField('l_sph', e.target.value)} style={eyeInputStyle} /></td>
                    <td style={{ padding: '0.25rem' }}><input type="number" step="0.25" placeholder="0.00" value={rxForm.l_cyl} onChange={e => setField('l_cyl', e.target.value)} style={eyeInputStyle} /></td>
                    <td style={{ padding: '0.25rem' }}><input type="number" min="0" max="180" placeholder="0" value={rxForm.l_axis} onChange={e => setField('l_axis', e.target.value)} style={eyeInputStyle} /></td>
                    <td style={{ padding: '0.25rem' }}><input type="number" step="0.25" placeholder="+0.00" value={rxForm.l_add} onChange={e => setField('l_add', e.target.value)} style={eyeInputStyle} /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* PD + Notes + Upload */}
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <div style={label}>PD (mm)</div>
                <input type="number" step="0.5" placeholder="62.0" value={rxForm.pd} onChange={e => setField('pd', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <div style={label}>Notes (optional)</div>
                <input type="text" placeholder="e.g. Bifocal, reading only, follow up in 6 months..." value={rxForm.notes} onChange={e => setField('notes', e.target.value)} style={inputStyle} />
              </div>
            </div>

            {/* File upload */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={label}>Upload Prescription Slip (photo / PDF — optional)</div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.875rem', border: '1.5px dashed #cbd5e1', borderRadius: '0.375rem', cursor: 'pointer', backgroundColor: rxFile ? '#f0fdf4' : 'white', color: rxFile ? '#166534' : '#6b7280', fontSize: '0.875rem' }}>
                <span style={{ fontSize: '1.25rem' }}>{rxFile ? '✅' : '📎'}</span>
                <span>{rxFile ? rxFile.name : 'Click to attach photo or PDF of prescription'}</span>
                <input type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                  onChange={e => setRxFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" disabled={isSaving}
                style={{ backgroundColor: '#1d4ed8', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                {isSaving ? 'Saving…' : 'Save Prescription'}
              </button>
              <button type="button" onClick={() => { setIsAddingRx(false); setRxForm(emptyRx); setRxFile(null) }}
                style={{ backgroundColor: 'white', color: '#6b7280', border: '1px solid #d1d5db', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Prescription list */}
        {prescriptions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: '0.9rem' }}>
            No prescriptions on file yet.{canWrite ? ' Click "+ New Prescription" to add one.' : ''}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {prescriptions.map(rx => {
              const re = eyeStr(rx.r_sph, rx.r_cyl, rx.r_axis, rx.r_add)
              const le = eyeStr(rx.l_sph, rx.l_cyl, rx.l_axis, rx.l_add)
              const hasDigital = re || le
              return (
                <div key={rx.prescription_id} style={{ border: '1px solid #e5e7eb', borderRadius: '0.375rem', padding: '0.875rem 1rem', backgroundColor: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{formatDate(rx.created_at)}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {rx.document_path && (
                        <button onClick={() => openDocumentUrl(rx.document_path!)}
                          style={{ fontSize: '0.75rem', color: '#2563eb', background: 'none', border: '1px solid #bfdbfe', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 500 }}>
                          📄 View Slip
                        </button>
                      )}
                    </div>
                  </div>

                  {hasDigital && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {re && <div style={{ fontSize: '0.875rem' }}><span style={{ fontWeight: 700, color: '#1d4ed8', marginRight: '0.5rem', fontSize: '0.75rem' }}>RE</span>{re}</div>}
                      {le && <div style={{ fontSize: '0.875rem' }}><span style={{ fontWeight: 700, color: '#1d4ed8', marginRight: '0.5rem', fontSize: '0.75rem' }}>LE</span>{le}</div>}
                      {rx.pd && <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>PD: {rx.pd} mm</div>}
                    </div>
                  )}

                  {!hasDigital && rx.document_path && (
                    <div style={{ marginTop: '0.375rem', fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>Uploaded slip only</div>
                  )}

                  {rx.notes && (
                    <div style={{ marginTop: '0.375rem', fontSize: '0.8rem', color: '#4b5563', backgroundColor: '#f9fafb', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                      💬 {rx.notes}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Purchase History ── */}
      <div style={card}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 1rem' }}>Purchase History</h2>
        {sales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>No purchases recorded yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Product</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Amount</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Payment</th>
                  <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 600, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s, i) => (
                  <tr key={s.sale_id} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                    <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap', color: '#6b7280' }}>{formatDateTime(s.sale_date)}</td>
                    <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #f3f4f6', fontWeight: 500 }}>{s.product_code}</td>
                    <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>₹{Number(s.sale_amount).toFixed(2)}</td>
                    <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ padding: '0.15rem 0.4rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 500, backgroundColor: s.payment_mode === 'UPI' ? '#dbeafe' : '#dcfce7', color: s.payment_mode === 'UPI' ? '#1e40af' : '#166534' }}>
                        {s.payment_mode}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                      {s.transaction_id ? (
                        <a href={`/dashboard/invoice/${s.transaction_id}`} target="_blank" rel="noopener noreferrer"
                          style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500 }}>
                          🖨 Print
                        </a>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
