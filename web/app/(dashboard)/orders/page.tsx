'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, CheckCircle2, Clock, Truck, Package2, XCircle, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { Order } from '@/types'
import { useAuthStore } from '@/store/auth.store'
import { useSocket } from '@/app/providers'

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',    color: 'bg-amber-100 text-amber-700',   icon: Clock },
  CONFIRMED: { label: 'Confirmed',  color: 'bg-blue-100 text-blue-700',     icon: CheckCircle2 },
  IN_TRANSIT:{ label: 'In Transit', color: 'bg-purple-100 text-purple-700', icon: Truck },
  DELIVERED: { label: 'Delivered',  color: 'bg-teal-100 text-teal-700',     icon: Package2 },
  COMPLETED: { label: 'Completed',  color: 'bg-green-100 text-green-700',   icon: CheckCircle2 },
  DISPUTED:  { label: 'Disputed',   color: 'bg-red-100 text-red-700',       icon: AlertCircle },
  CANCELLED: { label: 'Cancelled',  color: 'bg-gray-100 text-gray-500',     icon: XCircle },
}

export default function OrdersPage() {
  const { user } = useAuthStore()
  const socket = useSocket()
  const [role, setRole] = useState<'all' | 'buyer' | 'seller'>('all')
  const queryClient = useQueryClient()

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', role],
    queryFn: () => api.get(`/orders?role=${role}`).then((r) => r.data.data as Order[]),
  })

  // Invalidate on real-time order status change
  useEffect(() => {
    if (!socket) return
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    }
    socket.on('order:update', handler)
    return () => { socket.off('order:update', handler) }
  }, [socket, queryClient])

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex gap-2">
        {(['all', 'buyer', 'seller'] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg border capitalize transition-colors',
              role === r
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
            )}
          >
            {r === 'all' ? 'All orders' : r === 'buyer' ? 'My purchases' : 'My sales'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-primary-600" /></div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const config = STATUS_CONFIG[order.status]
            const isBuyer = order.buyerId === user?.id
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{order.drugName}</h3>
                    <p className="text-sm text-gray-400">
                      {order.quantity} {order.unit} ·{' '}
                      {isBuyer
                        ? `From ${order.seller.facility?.name || order.seller.firstName}`
                        : `To ${order.buyer.firstName} ${order.buyer.lastName}`}
                    </p>
                  </div>
                  <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1', config.color)}>
                    <config.icon size={12} /> {config.label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Total</p>
                    <p className="font-semibold">{formatCurrency(order.totalPrice)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Escrow</p>
                    <p className="font-semibold">{formatCurrency(order.escrowAmount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Placed</p>
                    <p className="font-semibold">{formatDate(order.createdAt)}</p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="border-t border-gray-50 pt-4 mb-4">
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {order.timeline.map((event, i) => (
                      <div key={event.id} className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex flex-col items-center">
                          <div className={cn('w-2 h-2 rounded-full', i === order.timeline.length - 1 ? 'bg-primary-600' : 'bg-gray-300')} />
                        </div>
                        <div className="text-xs">
                          <p className="font-medium text-gray-700">{event.description}</p>
                          <p className="text-gray-400">{formatDate(event.createdAt)}</p>
                        </div>
                        {i < order.timeline.length - 1 && <div className="w-6 h-px bg-gray-200 flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {isBuyer && order.status === 'DELIVERED' && (
                    <button
                      type="button"
                      onClick={() => statusMutation.mutate({ id: order.id, status: 'COMPLETED' })}
                      disabled={statusMutation.isPending}
                      className="text-xs font-semibold bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
                    >
                      Confirm Receipt
                    </button>
                  )}
                  {!isBuyer && order.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => statusMutation.mutate({ id: order.id, status: 'CONFIRMED' })}
                      disabled={statusMutation.isPending}
                      className="text-xs font-semibold bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 disabled:opacity-60 transition-colors"
                    >
                      Confirm Order
                    </button>
                  )}
                  {!isBuyer && order.status === 'CONFIRMED' && (
                    <button
                      type="button"
                      onClick={() => statusMutation.mutate({ id: order.id, status: 'IN_TRANSIT' })}
                      disabled={statusMutation.isPending}
                      className="text-xs font-semibold bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 disabled:opacity-60 transition-colors"
                    >
                      Mark Dispatched
                    </button>
                  )}
                  {['PENDING', 'CONFIRMED', 'IN_TRANSIT'].includes(order.status) && (
                    <button
                      type="button"
                      onClick={() => statusMutation.mutate({ id: order.id, status: 'CANCELLED' })}
                      disabled={statusMutation.isPending}
                      className="text-xs font-semibold border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-60 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          {orders.length === 0 && (
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
              <p className="font-medium">No orders yet</p>
              <p className="text-sm mt-1">Orders you place or receive will appear here</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
