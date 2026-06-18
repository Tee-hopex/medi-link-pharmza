import type { ThemeColors } from './theme'

const NOW = Date.now()
const H   = 3_600_000
const D   = 86_400_000

export interface Listing {
  id: string
  drugName: string
  genericName: string
  category: string
  quantity: number
  unit: string
  unitPrice: number
  expiryDays: number
  listingEndMs: number
  pharmacyName: string
  pharmacyId: string
  verified: boolean
  verificationLevel: 1 | 2 | 3
  distance: number
  nafdacNo: string
  batch: string
  latitude: number
  longitude: number
  address: string
}

export function getRemainingSeconds(endMs: number): number {
  return Math.max(0, Math.floor((endMs - Date.now()) / 1000))
}

export function formatCountdown(secs: number): string {
  const d = Math.floor(secs / 86400)
  const h = Math.floor((secs % 86400) / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (d > 0) return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
  return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
}

export function listingUrgencyColor(secs: number, colors: ThemeColors): string {
  if (secs < 172_800) return colors.error    // < 48 h
  if (secs < 604_800) return colors.warning  // < 7 d
  return colors.sage
}

export const MOCK_LISTINGS: Listing[] = [
  {
    id: 'L1', drugName: 'Metformin 850mg', genericName: 'Metformin Hydrochloride',
    category: 'Antidiabetic', quantity: 48, unit: 'Tabs', unitPrice: 85,
    expiryDays: 6, listingEndMs: NOW + 9 * H,
    pharmacyName: 'Medplus Victoria Island', pharmacyId: 'P1',
    verified: true, verificationLevel: 3, distance: 1.2,
    nafdacNo: 'A4-1043', batch: 'B2023-11',
    latitude: 6.4281, longitude: 3.4219,
    address: '15 Adeola Odeku St, Victoria Island, Lagos',
  },
  {
    id: 'L2', drugName: 'Ibuprofen 400mg', genericName: 'Ibuprofen',
    category: 'NSAID', quantity: 120, unit: 'Tabs', unitPrice: 55,
    expiryDays: 3, listingEndMs: NOW + 31 * H,
    pharmacyName: 'HealthPlus Ikeja', pharmacyId: 'P2',
    verified: true, verificationLevel: 2, distance: 3.4,
    nafdacNo: 'A4-0309', batch: 'B2023-12',
    latitude: 6.6018, longitude: 3.3515,
    address: '7 Allen Ave, Ikeja, Lagos',
  },
  {
    id: 'L3', drugName: 'Ciprofloxacin 500mg', genericName: 'Ciprofloxacin HCl',
    category: 'Antibiotic', quantity: 72, unit: 'Tabs', unitPrice: 145,
    expiryDays: 14, listingEndMs: NOW + 5 * D,
    pharmacyName: 'Lifemeds Lekki', pharmacyId: 'P3',
    verified: true, verificationLevel: 2, distance: 5.1,
    nafdacNo: 'A4-0722', batch: 'B2024-01',
    latitude: 6.4698, longitude: 3.5852,
    address: '22 Admiralty Way, Lekki Phase 1, Lagos',
  },
  {
    id: 'L4', drugName: 'Artemether 20mg', genericName: 'Artemether / Lumefantrine',
    category: 'Antimalarial', quantity: 36, unit: 'Tabs', unitPrice: 320,
    expiryDays: 22, listingEndMs: NOW + 10 * D,
    pharmacyName: 'Reddington Pharmacy', pharmacyId: 'P4',
    verified: true, verificationLevel: 3, distance: 2.8,
    nafdacNo: 'A4-3101', batch: 'B2024-05',
    latitude: 6.5095, longitude: 3.3711,
    address: '12 Medical Rd, Yaba, Lagos',
  },
  {
    id: 'L5', drugName: 'Omeprazole 20mg', genericName: 'Omeprazole',
    category: 'Antacid', quantity: 60, unit: 'Caps', unitPrice: 95,
    expiryDays: 28, listingEndMs: NOW + 20 * D,
    pharmacyName: 'Alpha Pharmacy Surulere', pharmacyId: 'P5',
    verified: false, verificationLevel: 1, distance: 4.7,
    nafdacNo: 'A4-2210', batch: 'B2024-02',
    latitude: 6.5058, longitude: 3.3564,
    address: '3 Adeniran Ogunsanya St, Surulere, Lagos',
  },
  {
    id: 'L6', drugName: 'Amoxicillin 500mg', genericName: 'Amoxicillin Trihydrate',
    category: 'Antibiotic', quantity: 200, unit: 'Caps', unitPrice: 120,
    expiryDays: 18, listingEndMs: NOW + 15 * D,
    pharmacyName: 'Drugfield Pharmacy', pharmacyId: 'P6',
    verified: true, verificationLevel: 2, distance: 6.3,
    nafdacNo: 'A4-0172L', batch: 'B2024-01',
    latitude: 6.4541, longitude: 3.3947,
    address: '8 Broad St, Lagos Island, Lagos',
  },
  {
    id: 'L7', drugName: 'Paracetamol 1g', genericName: 'Acetaminophen',
    category: 'Analgesic', quantity: 500, unit: 'Tabs', unitPrice: 40,
    expiryDays: 9, listingEndMs: NOW + 7 * D,
    pharmacyName: 'Medicare Pharmacy', pharmacyId: 'P7',
    verified: true, verificationLevel: 1, distance: 0.9,
    nafdacNo: 'A4-0055', batch: 'B2024-03',
    latitude: 6.4350, longitude: 3.4100,
    address: '44 Ozumba Mbadiwe Ave, VI, Lagos',
  },
]
