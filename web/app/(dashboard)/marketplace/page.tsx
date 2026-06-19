'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, ShoppingCart, Loader2, X, AlertTriangle, Package } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, daysUntil, cn } from '@/lib/utils'
import type { MarketplaceListing } from '@/types'
import { useAuthStore } from '@/store/auth.store'

function CreateListingModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm()
  const [inventoryItemId, setInventoryItemId] = useState('')

  const { data: inventory = [] } = useQuery<any[]>({
    queryKey: ['inventory-picker'],
    queryFn: () => api.get('/inventory').then((r) => r.data.data),
  })

  const mutation = useMutation({
    mutationFn: (data: unknown) => api.post('/marketplace', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['marketplace'] }); onClose() },
  })

  const handleInventorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setInventoryItemId(id)
    if (!id) return
    const item = inventory.find((i) => i.id === id)
    if (!item) return
    setValue('drugName', item.name)
    setValue('genericName', item.genericName ?? '')
    setValue('category', item.category ?? '')
    setValue('unit', item.unit)
    setValue('quantity', item.quantity)
    setValue('askingPrice', item.sellingPrice)
    setValue('originalPrice', item.sellingPrice)
    setValue('expiryDate', new Date(item.expiryDate).toISOString().split('T')[0])
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Create Listing</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        {/* Inventory picker — only shown when inventory has items */}
        {inventory.length > 0 && (
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Import from inventory</label>
            <div className="relative">
              <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500 pointer-events-none" />
              <select
                value={inventoryItemId}
                onChange={handleInventorySelect}
                className={cn(inputClass, 'pl-8 bg-primary-50 border-primary-200 text-primary-800')}
              >
                <option value="">— Select a drug to pre-fill —</option>
                {inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.quantity} {item.unit}
                  </option>
                ))}
              </select>
            </div>
            {inventoryItemId && (
              <p className="text-xs text-primary-600 mt-1.5">Form pre-filled — adjust as needed</p>
            )}
            <div className="border-t border-gray-100 my-4" />
          </div>
        )}

        <form onSubmit={handleSubmit((d) => mutation.mutate({ ...d, ...(inventoryItemId && { inventoryItemId }) }))} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Drug name *</label>
            <input {...register('drugName', { required: true })} placeholder="Amoxicillin 500mg" className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Generic name</label>
            <input {...register('genericName')} placeholder="e.g. Amoxicillin Trihydrate" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Quantity *</label>
              <input {...register('quantity', { required: true, valueAsNumber: true })} type="number" placeholder="50" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Unit *</label>
              <input {...register('unit', { required: true })} placeholder="Tabs" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Asking price (₦) *</label>
              <input {...register('askingPrice', { required: true, valueAsNumber: true })} type="number" step="0.01" placeholder="3500" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Original price (₦)</label>
              <input {...register('originalPrice', { valueAsNumber: true })} type="number" step="0.01" placeholder="5000" className={inputClass} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Expiry date *</label>
            <input {...register('expiryDate', { required: true })} type="date" className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Category</label>
            <input {...register('category')} placeholder="Antibiotics" className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
            <textarea {...register('description')} rows={2} placeholder="Additional details..." className={inputClass} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input {...register('isUrgent')} type="checkbox" className="rounded text-primary-600" />
            Mark as urgent listing
          </label>
          <button type="submit" disabled={isSubmitting || mutation.isPending}
            className="w-full bg-primary-600 text-white font-semibold py-2.5 rounded-lg hover:bg-primary-700 disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
            {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
            Create Listing
          </button>
        </form>
      </div>
    </div>
  )
}

export default function MarketplacePage() {
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [urgent, setUrgent] = useState(false)
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['marketplace', search, urgent],
    queryFn: () => {
      const p = new URLSearchParams()
      if (search) p.set('search', search)
      if (urgent) p.set('urgentOnly', 'true')
      return api.get(`/marketplace?${p}`).then((r) => r.data.data as MarketplaceListing[])
    },
  })

  const orderMutation = useMutation({
    mutationFn: ({ listingId, quantity }: { listingId: string; quantity: number }) =>
      api.post('/orders', { listingId, quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })

  return (
    <div className="space-y-5 max-w-7xl">
      {showModal && <CreateListingModal onClose={() => setShowModal(false)} />}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search medications..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" />
        </div>
        <button onClick={() => setUrgent(!urgent)}
          className={cn('px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors', urgent ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300')}>
          Urgent only
        </button>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-700 text-sm">
          <Plus size={16} /> List Drug
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-primary-600" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => {
            const days = daysUntil(listing.expiryDate)
            const discount = listing.originalPrice ? Math.round((1 - listing.askingPrice / listing.originalPrice) * 100) : null
            const isOwn = listing.sellerId === user?.id
            return (
              <div key={listing.id} className={cn('bg-white rounded-2xl border p-5 flex flex-col gap-3', listing.isUrgent ? 'border-red-200' : 'border-gray-100')}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {listing.isUrgent && <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">URGENT</span>}
                      {discount && <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">-{discount}%</span>}
                    </div>
                    <h3 className="font-semibold text-gray-900">{listing.drugName}</h3>
                    <p className="text-xs text-gray-400">{listing.genericName || listing.category || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{listing.quantity} {listing.unit}</span>
                  <div className="text-right">
                    <p className="font-bold text-primary-700">{formatCurrency(listing.askingPrice)}</p>
                    {listing.originalPrice && <p className="text-xs text-gray-400 line-through">{formatCurrency(listing.originalPrice)}</p>}
                  </div>
                </div>
                <div className={cn('flex items-center gap-1.5 text-xs', days <= 30 ? 'text-red-600' : days <= 60 ? 'text-amber-600' : 'text-gray-400')}>
                  {days <= 60 && <AlertTriangle size={12} />}
                  Expires {formatDate(listing.expiryDate)} · {days}d left
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <div className="text-xs text-gray-500">
                    {listing.seller.facility?.name || `${listing.seller.firstName} ${listing.seller.lastName}`}
                    {listing.seller.facility?.verified && <span className="ml-1 text-primary-600">✓</span>}
                  </div>
                  {!isOwn && (
                    <button onClick={() => orderMutation.mutate({ listingId: listing.id, quantity: listing.quantity })}
                      disabled={orderMutation.isPending}
                      className="flex items-center gap-1.5 text-xs font-semibold bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-60">
                      <ShoppingCart size={13} /> Buy
                    </button>
                  )}
                  {isOwn && <span className="text-xs text-gray-400 font-medium">Your listing</span>}
                </div>
              </div>
            )
          })}
          {listings.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">No listings found</div>
          )}
        </div>
      )}
    </div>
  )
}
