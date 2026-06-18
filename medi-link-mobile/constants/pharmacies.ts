import type { ThemeColors } from './theme'

export type StockLevel = 'high' | 'medium' | 'low' | 'out'

export interface NearbyPharmacy {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  distance: number
  verified: boolean
  verificationLevel: 1 | 2 | 3
  stockLevel: StockLevel
  phone: string
  openNow: boolean
  quantity?: number
  unit?: string
  unitPrice?: number
}

export function stockColor(level: StockLevel, colors: ThemeColors): string {
  switch (level) {
    case 'high':   return colors.sage
    case 'medium': return colors.warning
    case 'low':    return colors.error
    case 'out':    return colors.textMuted
  }
}

export function stockLabel(level: StockLevel): string {
  switch (level) {
    case 'high':   return 'In Stock'
    case 'medium': return 'Limited'
    case 'low':    return 'Low Stock'
    case 'out':    return 'Out of Stock'
  }
}

export const MOCK_PHARMACIES: NearbyPharmacy[] = [
  {
    id: 'P7', name: 'Medicare Pharmacy',
    address: '44 Ozumba Mbadiwe Ave, VI',
    latitude: 6.4350, longitude: 3.4100, distance: 0.9,
    verified: true, verificationLevel: 1,
    stockLevel: 'medium', phone: '08087654321', openNow: true,
  },
  {
    id: 'P1', name: 'Medplus Victoria Island',
    address: '15 Adeola Odeku St, Victoria Island',
    latitude: 6.4281, longitude: 3.4219, distance: 1.2,
    verified: true, verificationLevel: 3,
    stockLevel: 'high', phone: '08012345678', openNow: true,
  },
  {
    id: 'P4', name: 'Reddington Pharmacy',
    address: '12 Medical Rd, Yaba',
    latitude: 6.5095, longitude: 3.3711, distance: 2.8,
    verified: true, verificationLevel: 3,
    stockLevel: 'high', phone: '08033330000', openNow: true,
  },
  {
    id: 'P2', name: 'HealthPlus Ikeja',
    address: '7 Allen Ave, Ikeja',
    latitude: 6.6018, longitude: 3.3515, distance: 3.4,
    verified: true, verificationLevel: 2,
    stockLevel: 'low', phone: '08022221111', openNow: false,
  },
  {
    id: 'P9', name: 'PharmaCare Yaba',
    address: '20 Herbert Macaulay Way, Yaba',
    latitude: 6.5150, longitude: 3.3800, distance: 3.8,
    verified: true, verificationLevel: 2,
    stockLevel: 'high', phone: '08011112222', openNow: true,
  },
  {
    id: 'P5', name: 'Alpha Pharmacy Surulere',
    address: '3 Adeniran Ogunsanya St, Surulere',
    latitude: 6.5058, longitude: 3.3564, distance: 4.7,
    verified: false, verificationLevel: 1,
    stockLevel: 'out', phone: '08099887766', openNow: true,
  },
  {
    id: 'P3', name: 'Lifemeds Lekki',
    address: '22 Admiralty Way, Lekki Phase 1',
    latitude: 6.4698, longitude: 3.5852, distance: 5.1,
    verified: true, verificationLevel: 2,
    stockLevel: 'medium', phone: '08055443322', openNow: true,
  },
]
