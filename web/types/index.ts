export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface InventoryItem {
  id: string
  userId: string
  name: string
  genericName?: string
  batchNumber?: string
  manufacturer?: string
  category?: string
  unit: string
  quantity: number
  costPrice: number
  sellingPrice: number
  expiryDate: string
  manufactureDate?: string
  barcode?: string
  location?: string
  notes?: string
  isDeadStock: boolean
  createdAt: string
  updatedAt: string
  daysLeft?: number
  urgency?: 'critical' | 'warning' | 'info'
}

export interface MarketplaceListing {
  id: string
  sellerId: string
  drugName: string
  genericName?: string
  category?: string
  quantity: number
  unit: string
  askingPrice: number
  originalPrice?: number
  expiryDate: string
  description?: string
  images: string[]
  status: 'ACTIVE' | 'RESERVED' | 'SOLD' | 'EXPIRED' | 'CANCELLED'
  isUrgent: boolean
  createdAt: string
  seller: {
    id: string
    firstName: string
    lastName: string
    facility?: { name: string; city: string; verified: boolean }
  }
}

export interface Order {
  id: string
  buyerId: string
  sellerId: string
  listingId: string
  drugName: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  escrowAmount: number
  status: 'PENDING' | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED'
  deliveryAddress?: string
  notes?: string
  createdAt: string
  updatedAt: string
  timeline: OrderEvent[]
  buyer: { id: string; firstName: string; lastName: string }
  seller: { id: string; firstName: string; lastName: string; facility?: { name: string } }
}

export interface OrderEvent {
  id: string
  status: string
  description: string
  actor?: string
  createdAt: string
}

export interface Patient {
  id: string
  name: string
  phone?: string
  condition?: string
  notes?: string
  createdAt: string
  medications: MedicationSchedule[]
}

export interface MedicationSchedule {
  id: string
  drugName: string
  dosage: string
  frequency: string
  startDate: string
  endDate?: string
  times: string[]
  adherence: 'ON_TRACK' | 'MISSED' | 'CRITICAL'
}

export interface WalletTransaction {
  id: string
  type: 'CREDIT' | 'DEBIT' | 'ESCROW' | 'RELEASE' | 'REFUND'
  amount: number
  description: string
  reference?: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED'
  createdAt: string
}

export interface Job {
  id: string
  title: string
  facility: string
  location: string
  type: 'FULL_TIME' | 'PART_TIME' | 'LOCUM' | 'CONTRACT'
  salary?: string
  description?: string
  isUrgent: boolean
  createdAt: string
  poster: { id: string; firstName: string; lastName: string; facility?: { name: string; city: string } }
}

export interface Channel {
  id: string
  name: string
  description?: string
  type: 'PUBLIC' | 'PROFESSIONAL' | 'PRIVATE' | 'ANNOUNCEMENT'
  icon?: string
  isPrivate: boolean
  _count: { members: number; messages: number }
  messages: Message[]
  members: { id: string }[]
}

export interface Message {
  id: string
  channelId: string
  senderId: string
  content: string
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'
  createdAt: string
  sender: { id: string; firstName: string; lastName: string; avatar?: string }
}

export interface Notification {
  id: string
  title: string
  body: string
  type: 'EXPIRY_ALERT' | 'ORDER_UPDATE' | 'EMERGENCY_RX' | 'MESSAGE' | 'SYSTEM'
  isRead: boolean
  data?: Record<string, unknown>
  createdAt: string
}

export interface DashboardStats {
  inventory: { total: number; totalValue: number; expiringSoon: number; expiringCritical: number; deadStock: number }
  marketplace: { activeListings: number }
  orders: { pending: number; completed: number }
  wallet: { balance: number; escrow: number }
}
