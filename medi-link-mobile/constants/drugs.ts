import type { ThemeColors } from './theme'

export type ExpiryStatus = 'expired' | 'critical' | 'warning' | 'good' | 'safe'

export interface Drug {
  id: string
  name: string
  genericName: string
  category: string
  batch: string
  quantity: number
  unit: string
  unitPrice: number
  reorderLevel: number
  expiryDays: number   // negative = already expired
  expiryDate?: string  // ISO date string from API
  manufacturer: string
  nafdacNo: string
  location: string
}

export function expiryStatus(days: number): ExpiryStatus {
  if (days < 0)  return 'expired'
  if (days <= 7)  return 'critical'
  if (days <= 30) return 'warning'
  if (days <= 90) return 'good'
  return 'safe'
}

export function expiryColor(status: ExpiryStatus, colors: ThemeColors): string {
  switch (status) {
    case 'expired':  return colors.textMuted
    case 'critical': return colors.error
    case 'warning':  return colors.warning
    case 'good':     return colors.warning
    case 'safe':     return colors.sage
  }
}

export function expiryLabel(days: number): string {
  if (days < 0)   return `Expired ${Math.abs(days)}d ago`
  if (days === 0) return 'Expires today'
  if (days <= 30) return `${days}d left`
  return `${days}d`
}

export const MOCK_DRUGS: Drug[] = [
  {
    id: '1', name: 'Amoxicillin 500mg', genericName: 'Amoxicillin Trihydrate',
    category: 'Antibiotic', batch: 'B2024-01', quantity: 142, unit: 'Caps',
    unitPrice: 120, reorderLevel: 50, expiryDays: 90, manufacturer: 'Emzor Pharma',
    nafdacNo: 'A4-0172L', location: 'Shelf A2',
  },
  {
    id: '2', name: 'Metformin 850mg', genericName: 'Metformin Hydrochloride',
    category: 'Antidiabetic', batch: 'B2023-11', quantity: 48, unit: 'Tabs',
    unitPrice: 85, reorderLevel: 40, expiryDays: 6, manufacturer: 'May & Baker',
    nafdacNo: 'A4-1043', location: 'Shelf B1',
  },
  {
    id: '3', name: 'Paracetamol 1g', genericName: 'Acetaminophen',
    category: 'Analgesic', batch: 'B2024-03', quantity: 8, unit: 'Tabs',
    unitPrice: 40, reorderLevel: 100, expiryDays: 45, manufacturer: 'GSK Nigeria',
    nafdacNo: 'A4-0055', location: 'Shelf A1',
  },
  {
    id: '4', name: 'Omeprazole 20mg', genericName: 'Omeprazole',
    category: 'Antacid', batch: 'B2024-02', quantity: 60, unit: 'Caps',
    unitPrice: 95, reorderLevel: 25, expiryDays: 62, manufacturer: 'Pfizer',
    nafdacNo: 'A4-2210', location: 'Shelf C3',
  },
  {
    id: '5', name: 'Ibuprofen 400mg', genericName: 'Ibuprofen',
    category: 'NSAID', batch: 'B2023-12', quantity: 22, unit: 'Tabs',
    unitPrice: 55, reorderLevel: 30, expiryDays: -3, manufacturer: 'Emzor Pharma',
    nafdacNo: 'A4-0309', location: 'Shelf A3',
  },
  {
    id: '6', name: 'Amlodipine 5mg', genericName: 'Amlodipine Besylate',
    category: 'Antihypertensive', batch: 'B2024-04', quantity: 200, unit: 'Tabs',
    unitPrice: 110, reorderLevel: 60, expiryDays: 180, manufacturer: 'Fidson',
    nafdacNo: 'A4-1876', location: 'Shelf B2',
  },
  {
    id: '7', name: 'Ciprofloxacin 500mg', genericName: 'Ciprofloxacin HCl',
    category: 'Antibiotic', batch: 'B2024-01', quantity: 15, unit: 'Tabs',
    unitPrice: 145, reorderLevel: 25, expiryDays: 14, manufacturer: 'NAFDAC',
    nafdacNo: 'A4-0722', location: 'Shelf A4',
  },
  {
    id: '8', name: 'Lisinopril 10mg', genericName: 'Lisinopril Dihydrate',
    category: 'Antihypertensive', batch: 'B2024-02', quantity: 88, unit: 'Tabs',
    unitPrice: 130, reorderLevel: 30, expiryDays: 120, manufacturer: 'Pfizer',
    nafdacNo: 'A4-2301', location: 'Shelf B2',
  },
  {
    id: '9', name: 'Artemether 20mg', genericName: 'Artemether / Lumefantrine',
    category: 'Antimalarial', batch: 'B2024-05', quantity: 36, unit: 'Tabs',
    unitPrice: 320, reorderLevel: 20, expiryDays: 22, manufacturer: 'Strides Pharma',
    nafdacNo: 'A4-3101', location: 'Shelf D1',
  },
  {
    id: '10', name: 'Multivitamin B-Complex', genericName: 'B-Complex Vitamins',
    category: 'Supplement', batch: 'B2024-06', quantity: 300, unit: 'Tabs',
    unitPrice: 25, reorderLevel: 100, expiryDays: 365, manufacturer: 'CHI Ltd',
    nafdacNo: 'A4-0612', location: 'Shelf E2',
  },
]
