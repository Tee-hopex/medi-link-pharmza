'use client'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Loader2, Building2, CheckCircle, Search } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Pharmacy {
  id: string
  name: string
  type: string
  address: string
  city: string
  state: string
  latitude?: number
  longitude?: number
  verified: boolean
  user: { firstName: string; lastName: string }
}

const TYPE_LABELS: Record<string, string> = {
  COMMUNITY_PHARMACY: 'Community',
  HOSPITAL_PHARMACY: 'Hospital',
  PHARMACY_CHAIN: 'Chain',
  HEALTHCARE_FACILITY: 'Healthcare',
  DISTRIBUTOR: 'Distributor',
  WHOLESALER: 'Wholesaler',
}

export default function PharmaciesPage() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [radius, setRadius] = useState(10)
  const [search, setSearch] = useState('')
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')

  // Try to get location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      setLocating(true)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude })
          setLocating(false)
        },
        () => {
          setLocationError('Location access denied — showing all pharmacies')
          setLocating(false)
        },
      )
    }
  }, [])

  const { data: pharmacies = [], isLoading } = useQuery({
    queryKey: ['pharmacies', coords, radius],
    queryFn: () => {
      const params = coords
        ? `lat=${coords.lat}&lon=${coords.lon}&radius=${radius}`
        : `radius=${radius}`
      return api.get(`/pharmacies/nearby?${params}`).then((r) => r.data.data as Pharmacy[])
    },
  })

  const filtered = pharmacies.filter((p) =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.city.toLowerCase().includes(search.toLowerCase()) ||
    p.state.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Controls */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, city, or state…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value={5}>5 km radius</option>
            <option value={10}>10 km radius</option>
            <option value={25}>25 km radius</option>
            <option value={50}>50 km radius</option>
            <option value={100}>100 km radius</option>
          </select>
        </div>

        {locating && (
          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
            <Loader2 size={12} className="animate-spin" /> Detecting your location…
          </p>
        )}
        {locationError && (
          <p className="text-xs text-amber-600 mt-3">{locationError}</p>
        )}
        {coords && !locating && (
          <p className="text-xs text-primary-600 mt-3 flex items-center gap-1.5">
            <MapPin size={12} /> Showing pharmacies within {radius} km of your location
          </p>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-primary-600" /></div>
      ) : (
        <>
          <p className="text-sm text-gray-500">{filtered.length} pharmacie{filtered.length !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((pharmacy) => (
              <div key={pharmacy.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <Building2 size={18} className="text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{pharmacy.name}</p>
                      <p className="text-xs text-gray-400">{TYPE_LABELS[pharmacy.type] ?? pharmacy.type}</p>
                    </div>
                  </div>
                  {pharmacy.verified && (
                    <span className="flex items-center gap-1 text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full flex-shrink-0">
                      <CheckCircle size={11} /> Verified
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <p className="text-sm text-gray-600 flex items-start gap-1.5">
                    <MapPin size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    {pharmacy.address}, {pharmacy.city}, {pharmacy.state}
                  </p>
                  <p className="text-xs text-gray-400">
                    Contact: {pharmacy.user.firstName} {pharmacy.user.lastName}
                  </p>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className={cn('col-span-2 text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100')}>
                <Building2 size={36} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No pharmacies found</p>
                <p className="text-sm mt-1">Try increasing the search radius or clearing the filter</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
