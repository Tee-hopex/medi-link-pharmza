'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatRelative, cn } from '@/lib/utils'

interface OrderEvent {
  id: string
  status: string
  description: string
  actor?: string
  createdAt: string
}

interface DisputedOrder {
  id: string
  drugName: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  notes?: string
  createdAt: string
  updatedAt: string
  buyer: { id: string; firstName: string; lastName: string; email: string }
  seller: { id: string; firstName: string; lastName: string; email: string }
  listing: { drugName: string; unit: string }
  timeline: OrderEvent[]
}

function DisputeCard({ order }: { order: DisputedOrder }) {
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [pendingResolution, setPendingResolution] = useState<'COMPLETED' | 'CANCELLED' | null>(null)

  const mutation = useMutation({
    mutationFn: ({ resolution }: { resolution: 'COMPLETED' | 'CANCELLED' }) =>
      api.patch(`/admin/disputes/${order.id}/resolve`, { resolution, notes: notes || undefined }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-disputes'] }),
  })

  const handleResolve = (resolution: 'COMPLETED' | 'CANCELLED') => {
    if (!showNotes) { setPendingResolution(resolution); setShowNotes(true); return }
    mutation.mutate({ resolution: pendingResolution! })
    setShowNotes(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-50 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">DISPUTED</span>
            <span className="text-xs text-gray-400">{formatRelative(order.updatedAt)}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mt-1">{order.drugName}</h3>
          <p className="text-sm text-gray-500">{order.quantity} {order.unit} · {formatCurrency(order.totalPrice)}</p>
        </div>
      </div>

      {/* Parties */}
      <div className="px-6 py-4 grid grid-cols-2 gap-4">
        {[
          { role: 'Buyer', user: order.buyer, color: 'bg-blue-50 text-blue-600' },
          { role: 'Seller', user: order.seller, color: 'bg-primary-50 text-primary-600' },
        ].map(({ role, user, color }) => (
          <div key={role} className={cn('rounded-xl p-3', color.split(' ')[0])}>
            <p className={cn('text-xs font-bold uppercase tracking-wide mb-1', color.split(' ')[1])}>{role}</p>
            <p className="text-sm font-semibold text-gray-800">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        ))}
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="px-6 pb-3">
          <p className="text-xs text-gray-400 font-medium mb-1">Order Notes</p>
          <p className="text-sm text-gray-600 italic">"{order.notes}"</p>
        </div>
      )}

      {/* Timeline */}
      {order.timeline.length > 0 && (
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-400 font-medium mb-2">Recent Activity</p>
          <div className="space-y-1.5">
            {order.timeline.map((e) => (
              <div key={e.id} className="flex items-start gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                <span className="text-gray-500">{e.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin notes input */}
      {showNotes && (
        <div className="px-6 pb-3">
          <textarea
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            rows={2}
            placeholder="Resolution notes (optional)…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-6 pb-5 flex gap-3">
        <button
          type="button"
          onClick={() => handleResolve('COMPLETED')}
          disabled={mutation.isPending}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {mutation.isPending && pendingResolution === 'COMPLETED'
            ? <Loader2 size={14} className="animate-spin" />
            : <CheckCircle2 size={14} />}
          Mark Complete
        </button>
        <button
          type="button"
          onClick={() => handleResolve('CANCELLED')}
          disabled={mutation.isPending}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 border border-red-200 text-sm font-semibold rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors"
        >
          {mutation.isPending && pendingResolution === 'CANCELLED'
            ? <Loader2 size={14} className="animate-spin" />
            : <XCircle size={14} />}
          Cancel Order
        </button>
      </div>
    </div>
  )
}

export default function AdminDisputesPage() {
  const { data: orders = [], isLoading } = useQuery<DisputedOrder[]>({
    queryKey: ['admin-disputes'],
    queryFn: () => api.get('/admin/disputes').then((r) => r.data.data),
  })

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
          <AlertTriangle size={20} className="text-red-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dispute Resolution</h1>
          <p className="text-sm text-gray-500">{orders.length} disputed {orders.length === 1 ? 'order' : 'orders'} awaiting resolution</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <CheckCircle2 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No disputes — all clear</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => <DisputeCard key={o.id} order={o} />)}
        </div>
      )}
    </div>
  )
}
