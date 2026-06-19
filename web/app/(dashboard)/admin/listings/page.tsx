'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShoppingBag, Search, Loader2, Trash2, X } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, daysUntil, cn } from '@/lib/utils'

interface Listing {
  id: string
  drugName: string
  genericName?: string
  category?: string
  quantity: number
  unit: string
  askingPrice: number
  expiryDate: string
  status: string
  isUrgent: boolean
  createdAt: string
  seller: {
    id: string
    firstName: string
    lastName: string
    email: string
    facility?: { name: string; city: string }
  }
}

const STATUS_META: Record<string, string> = {
  ACTIVE:    'text-green-600 bg-green-50 border-green-200',
  RESERVED:  'text-blue-600 bg-blue-50 border-blue-200',
  SOLD:      'text-gray-500 bg-gray-50 border-gray-200',
  EXPIRED:   'text-red-500 bg-red-50 border-red-200',
  CANCELLED: 'text-gray-400 bg-gray-50 border-gray-100',
}

function RemoveModal({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')

  const mutation = useMutation({
    mutationFn: () => api.patch(`/admin/listings/${listing.id}/remove`, { reason: reason || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-listings'] }); onClose() },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Remove Listing</h2>
            <p className="text-sm text-gray-500 mt-1">{listing.drugName}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <textarea
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
          rows={3}
          placeholder="Reason for removal (optional — seller will be notified)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Remove Listing
          </button>
          <button type="button" onClick={onClose} className="px-4 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function AdminListingsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [removing, setRemoving] = useState<Listing | null>(null)

  const { data: listings = [], isLoading } = useQuery<Listing[]>({
    queryKey: ['admin-listings', statusFilter, search],
    queryFn: () => {
      const p = new URLSearchParams()
      if (statusFilter) p.set('status', statusFilter)
      if (search) p.set('search', search)
      return api.get(`/admin/listings?${p}`).then((r) => r.data.data)
    },
  })

  return (
    <>
      {removing && <RemoveModal listing={removing} onClose={() => setRemoving(null)} />}

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
            <ShoppingBag size={20} className="text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Listings Moderation</h1>
            <p className="text-sm text-gray-500">{listings.length} listings</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              placeholder="Search drug name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="RESERVED">Reserved</option>
            <option value="SOLD">Sold</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gray-300" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ShoppingBag size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium text-sm">No listings found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Drug</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Seller</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expiry</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Listed</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {listings.map((l) => {
                  const days = daysUntil(l.expiryDate)
                  const expColor = days < 0 ? 'text-red-500' : days <= 30 ? 'text-amber-500' : 'text-gray-500'
                  return (
                    <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{l.drugName}</p>
                        {l.genericName && <p className="text-xs text-gray-400">{l.genericName}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{l.quantity} {l.unit}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <p className="font-medium text-gray-700">{l.seller.firstName} {l.seller.lastName}</p>
                        <p className="text-gray-400">{l.seller.facility?.name ?? l.seller.email}</p>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-gray-800">{formatCurrency(l.askingPrice)}</td>
                      <td className={cn('px-4 py-3.5 text-xs font-medium', expColor)}>
                        {days < 0 ? 'Expired' : `${days}d left`}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-lg border', STATUS_META[l.status] ?? 'text-gray-500 bg-gray-50 border-gray-200')}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400">{formatDate(l.createdAt)}</td>
                      <td className="px-4 py-3.5">
                        {l.status !== 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() => setRemoving(l)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove listing"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
