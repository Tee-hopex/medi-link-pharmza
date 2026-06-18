'use client'
import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Zap, Loader2, MapPin, CheckCircle, User, Clock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'
import { useSocket } from '@/app/providers'
import { formatRelative } from '@/lib/utils'

interface EmergencyResponse {
  id: string
  responderId: string
  pharmacyName: string
  quantity: number
  price?: number
  eta?: string
  createdAt: string
}

export default function EmergencyRxPage() {
  const socket = useSocket()
  const [broadcastId, setBroadcastId] = useState<string | null>(null)
  const [responses, setResponses] = useState<EmergencyResponse[]>([])
  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm()

  const mutation = useMutation({
    mutationFn: (data: unknown) => api.post('/emergency-rx/broadcast', data).then((r) => r.data.data),
    onSuccess: (data: { id: string }) => {
      setBroadcastId(data.id)
      reset()
    },
  })

  // Listen for real-time responses on the socket
  useEffect(() => {
    if (!socket || !broadcastId) return
    const handler = (response: EmergencyResponse) => {
      setResponses((prev) => [response, ...prev])
    }
    socket.on('emergency:response', handler)
    return () => { socket.off('emergency:response', handler) }
  }, [socket, broadcastId])

  const handleLocate = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('latitude', pos.coords.latitude)
        setValue('longitude', pos.coords.longitude)
      },
      (err) => console.error(err),
    )
  }

  const inputClass = 'w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'

  return (
    <div className="max-w-xl space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Zap size={20} className="text-red-600" />
          <h2 className="font-semibold text-red-800">Emergency Drug Request</h2>
        </div>
        <p className="text-sm text-red-600">Broadcast an urgent request to nearby pharmacies. Responses arrive in real-time.</p>
      </div>

      {broadcastId && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">Request broadcast sent!</p>
              <p className="text-sm text-green-600">Waiting for nearby pharmacies to respond...</p>
            </div>
          </div>

          {responses.length > 0 ? (
            <div className="space-y-3 mt-2">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">{responses.length} response{responses.length !== 1 ? 's' : ''}</p>
              {responses.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-green-100 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={14} className="text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{r.pharmacyName}</p>
                        <p className="text-xs text-gray-500">{r.quantity} units available{r.price ? ` · ₦${r.price}` : ''}</p>
                      </div>
                    </div>
                    {r.eta && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={12} /> {r.eta}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{formatRelative(r.createdAt)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-green-600 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Waiting for responses...
            </p>
          )}

          <button type="button" onClick={() => { setBroadcastId(null); setResponses([]) }}
            className="mt-4 text-sm text-green-700 font-medium underline">
            Send another request
          </button>
        </div>
      )}

      {!broadcastId && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Drug name *</label>
              <input {...register('drugName', { required: true })} placeholder="Insulin Glargine 100U/mL" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Quantity *</label>
                <input {...register('quantity', { required: true, valueAsNumber: true })} type="number" placeholder="5" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Unit *</label>
                <input {...register('unit', { required: true })} placeholder="Vials" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Urgency level *</label>
              <select {...register('urgency', { required: true })} className={inputClass}>
                <option value="CRITICAL">Critical — Needed within the hour</option>
                <option value="HIGH">High — Needed today</option>
                <option value="MEDIUM">Medium — Needed within 24 hours</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Search radius (km)</label>
              <select {...register('radius', { valueAsNumber: true })} className={inputClass}>
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
                <option value={50}>50 km</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Latitude *</label>
                <input {...register('latitude', { required: true, valueAsNumber: true })} type="number" step="any" placeholder="6.5244" className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Longitude *</label>
                <input {...register('longitude', { required: true, valueAsNumber: true })} type="number" step="any" placeholder="3.3792" className={inputClass} />
              </div>
            </div>
            <button type="button" onClick={handleLocate} className="flex items-center gap-2 text-sm text-primary-600 font-medium hover:underline">
              <MapPin size={15} /> Use my current location
            </button>
            <button type="submit" disabled={isSubmitting || mutation.isPending}
              className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
              {mutation.isPending ? 'Broadcasting...' : 'Broadcast Emergency Request'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
