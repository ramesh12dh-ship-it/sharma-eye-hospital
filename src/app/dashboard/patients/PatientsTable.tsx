'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { Plus, X, Pencil, Check, ArrowUpRight } from 'lucide-react'
import { formatDate } from '@/utils/date'
import { Input, Label } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { TableShell, TableScroll, Table, Thead, Th, Tr, Td, TableEmpty } from '@/components/ui/Table'
import { cn } from '@/lib/utils'

type Patient = {
  patient_id: string
  name: string
  phone: string
  age: number | null
  address: string | null
  created_at: string
}

const canEdit = (role: string) =>
  role === 'admin' || role === 'receptionist' || role === 'store_manager'

export default function PatientsTable({
  initialPatients, userRole,
}: { initialPatients: Patient[]; userRole: string }) {
  const supabase = createClient()
  const [patients, setPatients] = useState<Patient[]>(initialPatients)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({ name: '', phone: '', age: '', address: '' })
  const [newPatient, setNewPatient] = useState({ name: '', phone: '', age: '', address: '' })

  const filteredPatients = useMemo(() => {
    const q = searchQuery.toLowerCase()
    if (!q) return patients
    return patients.filter(p => p.name.toLowerCase().includes(q) || p.phone.includes(q))
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
      setFeedback({
        type: 'error',
        text: error.message.includes('unique')
          ? `A patient with phone ${newPatient.phone} already exists.`
          : 'Could not save patient. Please try again.',
      })
    } else if (data) {
      setPatients([data, ...patients])
      setFeedback({ type: 'success', text: `Patient "${data.name}" added.` })
      setIsAdding(false)
      setNewPatient({ name: '', phone: '', age: '', address: '' })
    }
    setIsSubmitting(false)
  }

  const startEdit = (p: Patient) => {
    setEditingId(p.patient_id)
    setEditData({
      name: p.name, phone: p.phone,
      age: p.age !== null ? String(p.age) : '',
      address: p.address ?? '',
    })
  }

  const handleSaveEdit = async (patient_id: string) => {
    setIsSubmitting(true)
    setFeedback(null)
    const { data, error } = await supabase
      .from('patients')
      .update({
        name: editData.name.trim(),
        phone: editData.phone.trim(),
        age: editData.age ? parseInt(editData.age) : null,
        address: editData.address.trim() || null,
      })
      .eq('patient_id', patient_id)
      .select()
      .single()
    if (error) {
      setFeedback({
        type: 'error',
        text: error.message.includes('unique')
          ? `Phone ${editData.phone} is already registered.`
          : 'Could not update. Please try again.',
      })
    } else if (data) {
      setPatients(patients.map(p => p.patient_id === patient_id ? data : p))
      setFeedback({ type: 'success', text: `Patient "${data.name}" updated.` })
      setEditingId(null)
    }
    setIsSubmitting(false)
  }

  return (
    <div className="space-y-5">
      {feedback && (
        <div
          className={cn(
            'flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-[13px]',
            feedback.type === 'success'
              ? 'border-accent-200 bg-accent-50 text-accent-700'
              : 'border-coral-200 bg-coral-50 text-coral-700',
          )}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="rounded-md p-0.5 hover:bg-white/50">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="text"
          placeholder="Search by name or phone…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-[12px] text-ink-500">
          <span className="font-medium text-ink-700 tabular">{filteredPatients.length}</span> patients
        </span>
        {canEdit(userRole) && (
          <Button
            onClick={() => setIsAdding(!isAdding)}
            size="sm"
            variant={isAdding ? 'secondary' : 'primary'}
            className="ml-auto"
          >
            {isAdding ? <X size={14} /> : <Plus size={14} />}
            {isAdding ? 'Cancel' : 'New patient'}
          </Button>
        )}
      </div>

      {/* Add form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Add a new patient</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddPatient} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField label="Full name *">
                  <Input required value={newPatient.name}
                    onChange={e => setNewPatient({ ...newPatient, name: e.target.value })}
                    placeholder="e.g. Ramesh Sharma" />
                </FormField>
                <FormField label="Phone *">
                  <Input required value={newPatient.phone}
                    onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })}
                    placeholder="e.g. 9876543210" />
                </FormField>
                <FormField label="Age">
                  <Input type="number" min={0} max={120} value={newPatient.age}
                    onChange={e => setNewPatient({ ...newPatient, age: e.target.value })}
                    placeholder="e.g. 45" />
                </FormField>
                <FormField label="Address" className="md:col-span-3">
                  <Input value={newPatient.address}
                    onChange={e => setNewPatient({ ...newPatient, address: e.target.value })}
                    placeholder="e.g. 12 MG Road, Nagpur" />
                </FormField>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving…' : 'Save patient'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <TableShell>
        <TableScroll>
          <Table minWidth={canEdit(userRole) ? 920 : 800}>
            <Thead>
              <tr>
                <Th>Name</Th>
                <Th>Phone</Th>
                <Th>Age</Th>
                <Th>Address</Th>
                <Th>Registered</Th>
                <Th>File</Th>
                {canEdit(userRole) && <Th className="text-right">Actions</Th>}
              </tr>
            </Thead>
            <tbody>
              {filteredPatients.map(p => {
                const isEditing = editingId === p.patient_id
                return (
                  <Tr
                    key={p.patient_id}
                    className={isEditing ? 'bg-amber-50/60' : ''}
                  >
                    {isEditing ? (
                      <>
                        <Td><Input value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} className="h-8" /></Td>
                        <Td><Input value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} className="h-8" /></Td>
                        <Td><Input type="number" min={0} max={120} value={editData.age} onChange={e => setEditData({ ...editData, age: e.target.value })} className="h-8 w-20" /></Td>
                        <Td><Input value={editData.address} onChange={e => setEditData({ ...editData, address: e.target.value })} className="h-8" /></Td>
                        <Td className="whitespace-nowrap text-ink-500">{formatDate(p.created_at)}</Td>
                        <Td>
                          <Link
                            href={`/dashboard/patients/${p.patient_id}`}
                            className="inline-flex items-center gap-1 text-[12.5px] font-medium text-brand-600 hover:text-brand-800"
                          >
                            View <ArrowUpRight size={12} />
                          </Link>
                        </Td>
                        <Td className="text-right whitespace-nowrap">
                          <button
                            onClick={() => handleSaveEdit(p.patient_id)}
                            disabled={isSubmitting}
                            className="mr-1 inline-flex items-center gap-1 rounded-md bg-accent-500 px-2 py-1 text-[12px] font-medium text-white hover:bg-accent-600 disabled:opacity-50"
                          >
                            <Check size={12} /> Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="inline-flex items-center gap-1 rounded-md border border-hairline bg-white px-2 py-1 text-[12px] font-medium text-ink-700 hover:bg-ink-100"
                          >
                            <X size={12} /> Cancel
                          </button>
                        </Td>
                      </>
                    ) : (
                      <>
                        <Td className="font-medium text-ink-900">{p.name}</Td>
                        <Td className="text-ink-700 tabular">{p.phone}</Td>
                        <Td className="text-ink-600">{p.age ?? <span className="text-ink-300">—</span>}</Td>
                        <Td className="max-w-[260px] truncate text-ink-600">{p.address ?? <span className="text-ink-300">—</span>}</Td>
                        <Td className="whitespace-nowrap text-ink-500">{formatDate(p.created_at)}</Td>
                        <Td>
                          <Link
                            href={`/dashboard/patients/${p.patient_id}`}
                            className="inline-flex items-center gap-1 text-[12.5px] font-medium text-brand-600 hover:text-brand-800"
                          >
                            View file <ArrowUpRight size={12} />
                          </Link>
                        </Td>
                        {canEdit(userRole) && (
                          <Td className="text-right">
                            <button
                              onClick={() => startEdit(p)}
                              className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50/60 px-1.5 py-1 text-[12px] font-medium text-brand-700 hover:bg-brand-100"
                            >
                              <Pencil size={12} /> Edit
                            </button>
                          </Td>
                        )}
                      </>
                    )}
                  </Tr>
                )
              })}
              {filteredPatients.length === 0 && (
                <TableEmpty
                  colSpan={canEdit(userRole) ? 7 : 6}
                  message={searchQuery ? `No patients matching "${searchQuery}"` : 'No patients registered yet.'}
                />
              )}
            </tbody>
          </Table>
        </TableScroll>
      </TableShell>
    </div>
  )
}

function FormField({
  label, children, className,
}: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}
