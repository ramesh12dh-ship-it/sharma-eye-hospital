'use client'

import React, { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { formatDateTime, formatDate } from '@/utils/date'

type Order = {
  order_id: string
  transaction_id: string
  patient_id: string
  status: 'ordered' | 'in_workshop' | 'ready' | 'delivered' | 'cancelled'
  notes: string | null
  expected_date: string | null
  actual_delivery: string | null
  created_at: string
  patients: { name: string; phone: string } | null
}

export default function OrdersList({ 
  initialActiveOrders, 
  initialDeliveredOrders,
  userRole 
}: { 
  initialActiveOrders: Order[], 
  initialDeliveredOrders: Order[],
  userRole: string 
}) {
  const supabase = createClient()
  const [activeOrders, setActiveOrders] = useState<Order[]>(initialActiveOrders)
  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>(initialDeliveredOrders)
  const [view, setView] = useState<'active' | 'delivered'>('active')
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const updateStatus = async (orderId: string, newStatus: Order['status']) => {
    setIsUpdating(orderId)
    const updateData: any = { status: newStatus }
    if (newStatus === 'delivered') {
      updateData.actual_delivery = new Date().toISOString()
    }

    const { error } = await supabase
      .from('optical_orders')
      .update(updateData)
      .eq('order_id', orderId)

    if (!error) {
      // Refresh local state
      const updatedOrder = [...activeOrders, ...deliveredOrders].find(o => o.order_id === orderId)
      if (updatedOrder) {
        const fresh = { ...updatedOrder, ...updateData }
        if (newStatus === 'delivered') {
          setActiveOrders(activeOrders.filter(o => o.order_id !== orderId))
          setDeliveredOrders([fresh, ...deliveredOrders].slice(0, 20))
        } else {
          setActiveOrders(activeOrders.map(o => o.order_id === orderId ? fresh : o))
        }
      }
    }
    setIsUpdating(null)
  }

  const getStatusBadge = (status: Order['status']) => {
    const styles: Record<string, React.CSSProperties> = {
      ordered: { backgroundColor: '#fef3c7', color: '#92400e' },
      in_workshop: { backgroundColor: '#ffedd5', color: '#9a3412' },
      ready: { backgroundColor: '#dcfce7', color: '#166534' },
      delivered: { backgroundColor: '#dbeafe', color: '#1e40af' },
      cancelled: { backgroundColor: '#fee2e2', color: '#991b1b' },
    }
    return (
      <span style={{ 
        padding: '0.25rem 0.625rem', 
        borderRadius: '9999px', 
        fontSize: '0.75rem', 
        fontWeight: 600, 
        textTransform: 'uppercase',
        ...styles[status] 
      }}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  const currentOrders = view === 'active' ? activeOrders : deliveredOrders

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e5e7eb', marginBottom: '2rem' }}>
        <button 
          onClick={() => setView('active')}
          style={{ 
            padding: '0.75rem 1rem', 
            border: 'none', 
            background: 'none', 
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '1rem',
            color: view === 'active' ? '#2563eb' : '#6b7280',
            borderBottom: view === 'active' ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom: '-1px'
          }}
        >
          Active Orders ({activeOrders.length})
        </button>
        <button 
          onClick={() => setView('delivered')}
          style={{ 
            padding: '0.75rem 1rem', 
            border: 'none', 
            background: 'none', 
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '1rem',
            color: view === 'delivered' ? '#2563eb' : '#6b7280',
            borderBottom: view === 'delivered' ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom: '-1px'
          }}
        >
          Delivered History
        </button>
      </div>

      {/* Orders Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {currentOrders.map(order => (
          <div key={order.order_id} style={{ 
            backgroundColor: 'white', 
            borderRadius: '0.75rem', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Card Header */}
            <div style={{ padding: '1rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{order.patients?.name || 'Unknown Patient'}</h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#6b7280' }}>{order.patients?.phone}</p>
              </div>
              {getStatusBadge(order.status)}
            </div>

            {/* Card Body */}
            <div style={{ padding: '1rem', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700 }}>Ordered On</label>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.9rem' }}>{formatDate(order.created_at)}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700 }}>Due Date</label>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.9rem', color: order.expected_date && new Date(order.expected_date) < new Date() ? '#dc2626' : 'inherit', fontWeight: order.expected_date && new Date(order.expected_date) < new Date() ? 600 : 400 }}>
                    {order.expected_date ? formatDate(order.expected_date) : 'Not set'}
                  </p>
                </div>
              </div>

              {order.notes && (
                <div style={{ backgroundColor: '#f9fafb', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700 }}>Workshop Notes</label>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#374151', whiteSpace: 'pre-wrap' }}>{order.notes}</p>
                </div>
              )}
            </div>

            {/* Card Footer / Actions */}
            {view === 'active' && (
              <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '0.5rem' }}>
                {order.status === 'ordered' && (
                  <button 
                    disabled={isUpdating === order.order_id}
                    onClick={() => updateStatus(order.order_id, 'in_workshop')}
                    style={{ flex: 1, padding: '0.5rem', backgroundColor: '#f97316', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
                  >
                    Send to Workshop
                  </button>
                )}
                {order.status === 'in_workshop' && (
                  <button 
                    disabled={isUpdating === order.order_id}
                    onClick={() => updateStatus(order.order_id, 'ready')}
                    style={{ flex: 1, padding: '0.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
                  >
                    Mark Ready
                  </button>
                )}
                {order.status === 'ready' && (
                  <button 
                    disabled={isUpdating === order.order_id}
                    onClick={() => updateStatus(order.order_id, 'delivered')}
                    style={{ flex: 1, padding: '0.5rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
                  >
                    Mark Delivered
                  </button>
                )}
                <button 
                  disabled={isUpdating === order.order_id}
                  onClick={() => {
                    if (confirm('Cancel this order?')) updateStatus(order.order_id, 'cancelled')
                  }}
                  style={{ padding: '0.5rem', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}
                >
                  Cancel
                </button>
              </div>
            )}
            
            {view === 'delivered' && (
               <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderTop: '1px solid #f3f4f6', fontSize: '0.8rem', color: '#6b7280' }}>
                  Delivered on {order.actual_delivery ? formatDateTime(order.actual_delivery) : 'Unknown'}
               </div>
            )}
          </div>
        ))}

        {currentOrders.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem', color: '#9ca3af' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📦</span>
            No orders found in this section.
          </div>
        )}
      </div>
    </div>
  )
}
