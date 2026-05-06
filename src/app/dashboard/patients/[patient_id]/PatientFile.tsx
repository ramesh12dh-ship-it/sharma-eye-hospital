'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { formatDate } from '@/utils/date'
import {
  ArrowLeft, Phone, MapPin, Calendar, Glasses, Plus, Paperclip,
  FileText, Trash2, Printer, ArrowRight,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { Badge, OrderStatusBadge } from '@/components/ui/Badge'
import { TableScroll, Table, Thead, Th, Tr, Td } from '@/components/ui/Table'
import { NumberStepper } from '@/components/ui/NumberStepper'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import { eyeStr } from '@/utils/optics'

type Patient = {
  patient_id: string
  name: string; phone: string
  age: number | null; address: string | null; created_at: string
}
type Prescription = {
  prescription_id: string; created_at: string
  r_sph: number | null; r_cyl: number | null; r_axis: number | null; r_add: number | null
  l_sph: number | null; l_cyl: number | null; l_axis: number | null; l_add: number | null
  pd: number | null; document_path: string | null; notes: string | null
}
type Sale = {
  sale_id: string; sale_date: string; product_code: string
  sale_amount: number; tax_rate: number; payment_mode: string
  transaction_id: string | null
}
type OpticalOrder = {
  order_id: string
  status: 'ordered' | 'in_workshop' | 'ready' | 'delivered' | 'cancelled'
  expected_date: string | null; notes: string | null; created_at: string
  actual_delivery?: string | null
}

type Props = {
  patient: Patient; prescriptions: Prescription[]
  sales: Sale[]; orders: OpticalOrder[]
  canWrite: boolean
  /** True when the user can change order status (admin/store_manager). */
  canUpdateOrders: boolean
  userId: string
}

const emptyRx = { r_sph: '', r_cyl: '', r_axis: '', r_add: '', l_sph: '', l_cyl: '', l_axis: '', l_add: '', pd: '', notes: '' }

export default function PatientFile({
  patient, prescriptions: initialPrescriptions, sales, orders: initialOrders, canWrite, canUpdateOrders, userId,
}: Props) {
  const supabase = createClient()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions)
  const [orders, setOrders] = useState<OpticalOrder[]>(initialOrders)
  const [isAddingRx, setIsAddingRx] = useState(false)
  const [rxForm, setRxForm] = useState(emptyRx)
  const [rxFile, setRxFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const updateOrderStatus = async (
    orderId: string,
    newStatus: OpticalOrder['status'],
  ) => {
    setUpdatingOrderId(orderId)
    const updateData: Partial<OpticalOrder> = { status: newStatus }
    if (newStatus === 'delivered') {
      updateData.actual_delivery = new Date().toISOString()
    }
    const { error } = await supabase
      .from('optical_orders')
      .update(updateData)
      .eq('order_id', orderId)
    if (error) {
      toast.error('Could not update order', error.message)
    } else {
      setOrders(prev => prev.map(o => (o.order_id === orderId ? { ...o, ...updateData } : o)))
      if (newStatus === 'delivered') toast.success('Marked delivered')
      else if (newStatus === 'cancelled') toast.info('Order cancelled')
    }
    setUpdatingOrderId(null)
  }

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
    if (!confirm('Delete this prescription?')) return
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

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled')

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link
        href="/dashboard/patients"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft size={13} /> Patients
      </Link>

      {/* Hero card — gradient slate-blue */}
      <div
        className="relative overflow-hidden rounded-2xl border border-brand-700/30 p-7 text-white shadow-[var(--shadow-lift)]"
        style={{
          background:
            'linear-gradient(135deg, var(--color-brand-700) 0%, var(--color-brand-500) 100%)',
        }}
      >
        <div
          aria-hidden
          className="watermark absolute right-[-80px] top-[-80px] h-[280px] w-[280px]"
          style={{ opacity: 0.12, filter: 'invert(1)' }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11.5px] font-medium uppercase tracking-[0.16em] text-brand-100/80">
              Patient file
            </p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-white">{patient.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-brand-100">
              <span className="inline-flex items-center gap-1.5"><Phone size={13} /> {patient.phone}</span>
              {patient.age && <span className="inline-flex items-center gap-1.5"><Calendar size={13} /> {patient.age} yrs</span>}
              {patient.address && <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {patient.address}</span>}
            </div>
          </div>
          <div className="text-right text-[12px] text-brand-100/90">
            <div className="text-[15px] font-semibold text-white">{prescriptions.length} prescriptions</div>
            <div>{sales.length} purchases</div>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={cn(
            'rounded-xl border px-4 py-2.5 text-[13px]',
            feedback.type === 'success'
              ? 'border-accent-200 bg-accent-50 text-accent-700'
              : 'border-coral-200 bg-coral-50 text-coral-700',
          )}
        >
          {feedback.text}
        </div>
      )}

      {activeOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Glasses size={16} className="text-brand-600" /> Active optical orders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeOrders.map(order => {
              const isBusy = updatingOrderId === order.order_id
              return (
                <div
                  key={order.order_id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-hairline bg-brand-50/40 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <OrderStatusBadge status={order.status} />
                      <span className="text-[13px] font-medium text-brand-800">
                        Due: {order.expected_date ? formatDate(order.expected_date) : 'N/A'}
                      </span>
                    </div>
                    {order.notes && (
                      <p className="mt-1.5 text-[13px] text-ink-600">{order.notes}</p>
                    )}
                  </div>

                  {canUpdateOrders ? (
                    <div className="flex items-center gap-1.5">
                      {order.status === 'ordered' && (
                        <Button size="sm" disabled={isBusy} onClick={() => updateOrderStatus(order.order_id, 'in_workshop')}>
                          To workshop <ArrowRight size={12} />
                        </Button>
                      )}
                      {order.status === 'in_workshop' && (
                        <Button size="sm" disabled={isBusy}
                          className="bg-accent-600 hover:bg-accent-700"
                          onClick={() => updateOrderStatus(order.order_id, 'ready')}
                        >
                          Mark ready <ArrowRight size={12} />
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button size="sm" disabled={isBusy} onClick={() => updateOrderStatus(order.order_id, 'delivered')}>
                          Mark delivered <ArrowRight size={12} />
                        </Button>
                      )}
                      <Link
                        href="/dashboard/orders"
                        className="rounded-md px-2 py-1 text-[12px] font-medium text-ink-500 hover:bg-ink-100 hover:text-ink-800"
                      >
                        Open →
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href="/dashboard/orders"
                      className="text-[12.5px] font-semibold text-brand-600 hover:text-brand-800"
                    >
                      Track →
                    </Link>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Prescriptions</CardTitle>
          {canWrite && !isAddingRx && (
            <Button size="sm" onClick={() => setIsAddingRx(true)}>
              <Plus size={13} /> New prescription
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isAddingRx && (
            <form
              onSubmit={handleSubmitRx}
              className="rounded-xl border border-hairline bg-ink-50/50 p-4"
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[12.5px] tabular">
                  <thead>
                    <tr className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                      <th className="px-2 py-1.5 text-left">Eye</th>
                      <th className="px-2 py-1.5">SPH</th>
                      <th className="px-2 py-1.5">CYL</th>
                      <th className="px-2 py-1.5">AXIS</th>
                      <th className="px-2 py-1.5">ADD</th>
                    </tr>
                  </thead>
                  <tbody>
                    <RxRow
                      eye="RE" form={rxForm} setField={setField}
                      keys={['r_sph', 'r_cyl', 'r_axis', 'r_add']}
                    />
                    <RxRow
                      eye="LE" form={rxForm} setField={setField}
                      keys={['l_sph', 'l_cyl', 'l_axis', 'l_add']}
                    />
                  </tbody>
                </table>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[120px_1fr]">
                <div>
                  <Label>PD (mm)</Label>
                  <Input
                    type="number" step="0.5" placeholder="62.0"
                    value={rxForm.pd}
                    onChange={e => setField('pd', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input
                    placeholder="e.g. Bifocal…"
                    value={rxForm.notes}
                    onChange={e => setField('notes', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label>Prescription slip (optional)</Label>
                <label
                  className={cn(
                    'mt-1 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-3.5 py-3 text-[13px] transition-colors',
                    rxFile
                      ? 'border-accent-300 bg-accent-50/50 text-accent-700'
                      : 'border-ink-300 bg-white/60 text-ink-600 hover:bg-white',
                  )}
                >
                  <Paperclip size={14} />
                  <span className="truncate">{rxFile ? rxFile.name : 'Click to attach photo or PDF'}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={e => setRxFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setIsAddingRx(false); setRxForm(emptyRx); setRxFile(null) }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save prescription'}
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {prescriptions.length === 0 && !isAddingRx && (
              <p className="py-6 text-center text-[13px] text-ink-400">
                No prescriptions on file yet.
              </p>
            )}
            {prescriptions.map(rx => {
              const re = eyeStr(rx.r_sph, rx.r_cyl, rx.r_axis, rx.r_add)
              const le = eyeStr(rx.l_sph, rx.l_cyl, rx.l_axis, rx.l_add)
              return (
                <div
                  key={rx.prescription_id}
                  className="rounded-xl border border-hairline bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Badge tone="muted">{formatDate(rx.created_at)}</Badge>
                    <div className="flex gap-1">
                      {rx.document_path && (
                        <button
                          onClick={() => openDocumentUrl(rx.document_path!)}
                          className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50/60 px-1.5 py-0.5 text-[11.5px] font-medium text-brand-700 hover:bg-brand-100"
                        >
                          <FileText size={11} /> Slip
                        </button>
                      )}
                      {canWrite && (
                        <button
                          onClick={() => handleDeleteRx(rx.prescription_id, rx.document_path)}
                          className="inline-flex items-center gap-1 rounded-md border border-coral-200 bg-coral-50/60 px-1.5 py-0.5 text-[11.5px] font-medium text-coral-700 hover:bg-coral-100"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                  <dl className="mt-3 space-y-1 tabular text-[13.5px]">
                    {re && (
                      <div className="flex gap-3">
                        <dt className="w-7 font-semibold text-brand-700">RE</dt>
                        <dd className="text-ink-800">{re}</dd>
                      </div>
                    )}
                    {le && (
                      <div className="flex gap-3">
                        <dt className="w-7 font-semibold text-brand-700">LE</dt>
                        <dd className="text-ink-800">{le}</dd>
                      </div>
                    )}
                  </dl>
                  {(rx.pd || rx.notes) && (
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-dashed border-hairline pt-2 text-[12px] text-ink-500">
                      {rx.pd && <span><span className="font-medium text-ink-700">PD:</span> {rx.pd} mm</span>}
                      {rx.notes && <span>{rx.notes}</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Purchase history</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <TableScroll>
            <Table minWidth={640}>
              <Thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Product</Th>
                  <Th className="text-right">Amount</Th>
                  <Th>Payment</Th>
                  <Th>Invoice</Th>
                </tr>
              </Thead>
              <tbody>
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[13px] text-ink-400">
                      No purchases recorded.
                    </td>
                  </tr>
                )}
                {sales.map(s => (
                  <Tr key={s.sale_id}>
                    <Td className="whitespace-nowrap text-ink-500">{formatDate(s.sale_date)}</Td>
                    <Td className="font-medium text-ink-900">{s.product_code}</Td>
                    <Td className="text-right font-semibold text-ink-900">
                      ₹{Number(s.sale_amount).toLocaleString('en-IN')}
                    </Td>
                    <Td>
                      <Badge tone={s.payment_mode === 'UPI' ? 'brand' : 'neutral'}>
                        {s.payment_mode}
                      </Badge>
                    </Td>
                    <Td>
                      {s.transaction_id ? (
                        <a
                          href={`/invoice/${s.transaction_id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[12.5px] font-medium text-brand-600 hover:text-brand-800"
                        >
                          <Printer size={12} />
                        </a>
                      ) : <span className="text-ink-300">—</span>}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>
        </CardContent>
      </Card>
    </div>
  )
}

function RxRow({
  eye, form, setField, keys,
}: {
  eye: 'RE' | 'LE'
  form: typeof emptyRx
  setField: (k: keyof typeof emptyRx, v: string) => void
  keys: [keyof typeof emptyRx, keyof typeof emptyRx, keyof typeof emptyRx, keyof typeof emptyRx]
}) {
  // Indices: 0=SPH, 1=CYL, 2=AXIS, 3=ADD — AXIS is integer 0–180, others are signed quarters.
  return (
    <tr className={eye === 'LE' ? 'bg-white/40' : ''}>
      <td className="px-2 py-1.5 font-semibold text-brand-700">{eye}</td>
      {keys.map((k, i) => {
        const isAxis = i === 2
        return (
          <td key={k} className="px-1 py-1">
            <NumberStepper
              value={form[k]}
              onChange={v => setField(k, v)}
              step={isAxis ? 5 : 0.25}
              precision={isAxis ? 0 : 2}
              min={isAxis ? 0 : undefined}
              max={isAxis ? 180 : undefined}
              signed={!isAxis}
              placeholder={isAxis ? '0' : '+0.00'}
            />
          </td>
        )
      })}
    </tr>
  )
}
