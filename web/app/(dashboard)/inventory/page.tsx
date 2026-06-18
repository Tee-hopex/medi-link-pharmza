'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, AlertTriangle, Trash2, Edit3, X, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, daysUntil, cn } from '@/lib/utils'
import type { InventoryItem } from '@/types'

function AddItemModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { isSubmitting } } = useForm()

  const mutation = useMutation({
    mutationFn: (data: unknown) => api.post('/inventory', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      onClose()
    },
  })

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Add drug to inventory</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Drug name *</label>
              <input {...register('name', { required: true })} placeholder="Amoxicillin 500mg" className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Generic name</label>
              <input {...register('genericName')} placeholder="Amoxicillin" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Batch number</label>
              <input {...register('batchNumber')} placeholder="BX20241" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Category</label>
              <input {...register('category')} placeholder="Antibiotics" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Unit *</label>
              <input {...register('unit', { required: true })} placeholder="Tabs" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Quantity *</label>
              <input {...register('quantity', { required: true, valueAsNumber: true })} type="number" placeholder="100" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Cost price (₦) *</label>
              <input {...register('costPrice', { required: true, valueAsNumber: true })} type="number" step="0.01" placeholder="5000" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Selling price (₦) *</label>
              <input {...register('sellingPrice', { required: true, valueAsNumber: true })} type="number" step="0.01" placeholder="7000" className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Expiry date *</label>
              <input {...register('expiryDate', { required: true })} type="date" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Manufacturer</label>
              <input {...register('manufacturer')} placeholder="GSK" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Barcode</label>
              <input {...register('barcode')} placeholder="1234567890" className={inputClass} />
            </div>
          </div>
          <button type="submit" disabled={isSubmitting || mutation.isPending}
            className="w-full bg-primary-600 text-white font-semibold py-2.5 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm mt-2">
            {(isSubmitting || mutation.isPending) && <Loader2 size={16} className="animate-spin" />}
            Add to inventory
          </button>
        </form>
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'expiring' | 'deadstock'>('all')
  const queryClient = useQueryClient()

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory', search, filter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filter === 'expiring') params.set('expiringInDays', '90')
      if (filter === 'deadstock') params.set('deadStockOnly', 'true')
      return api.get(`/inventory?${params}`).then((r) => r.data.data as InventoryItem[])
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/inventory/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  })

  return (
    <div className="space-y-5 max-w-7xl">
      {showModal && <AddItemModal onClose={() => setShowModal(false)} />}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search drugs..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'expiring', 'deadstock'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-3 py-2 text-sm font-medium rounded-lg border transition-colors', filter === f ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300')}>
              {f === 'all' ? 'All' : f === 'expiring' ? 'Expiring' : 'Dead Stock'}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-700 transition-colors text-sm">
          <Plus size={16} /> Add Drug
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-primary-600" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No inventory items found</p>
            <p className="text-sm mt-1">Add your first drug to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Drug', 'Batch', 'Qty', 'Cost Price', 'Selling Price', 'Expiry', 'Status', ''].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => {
                  const days = daysUntil(item.expiryDate)
                  const urgent = days <= 30
                  const warning = days <= 60 && days > 30
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.genericName || item.category || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{item.batchNumber || '—'}</td>
                      <td className="px-4 py-3 font-medium">{item.quantity} <span className="text-gray-400 font-normal">{item.unit}</span></td>
                      <td className="px-4 py-3 text-gray-600">{formatCurrency(item.costPrice)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatCurrency(item.sellingPrice)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {(urgent || warning) && <AlertTriangle size={13} className={urgent ? 'text-red-500' : 'text-amber-500'} />}
                          <span className={urgent ? 'text-red-600 font-medium' : warning ? 'text-amber-600 font-medium' : 'text-gray-600'}>
                            {formatDate(item.expiryDate)}
                          </span>
                        </div>
                        <p className={`text-xs ${urgent ? 'text-red-400' : warning ? 'text-amber-400' : 'text-gray-400'}`}>{days}d left</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', item.isDeadStock ? 'bg-amber-100 text-amber-700' : urgent ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
                          {item.isDeadStock ? 'Dead Stock' : urgent ? 'Critical' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteMutation.mutate(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Package = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
    <path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>
  </svg>
)
