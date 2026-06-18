import type { ThemeColors } from './theme'

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'DISPUTED'

export interface OrderEvent {
  status: OrderStatus
  label: string
  time: string
  done: boolean
}

export interface Order {
  id: string
  listingId: string
  drugName: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  sellerName: string
  sellerVerified: boolean
  status: OrderStatus
  createdAt: string
  escrowAmount: number
  timeline: OrderEvent[]
  deliveryAddress: string
  distance: number
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING:    'Awaiting Confirmation',
  CONFIRMED:  'Confirmed',
  IN_TRANSIT: 'Out for Delivery',
  DELIVERED:  'Delivered',
  COMPLETED:  'Completed',
  DISPUTED:   'Disputed',
}

export function statusColor(status: OrderStatus, colors: ThemeColors): string {
  switch (status) {
    case 'PENDING':    return colors.warning
    case 'CONFIRMED':  return colors.sage
    case 'IN_TRANSIT': return colors.teal
    case 'DELIVERED':  return colors.sage
    case 'COMPLETED':  return colors.sage
    case 'DISPUTED':   return colors.error
  }
}

export const MOCK_ORDERS: Order[] = [
  {
    id: 'O1', listingId: 'L1',
    drugName: 'Metformin 850mg', quantity: 48, unit: 'Tabs', unitPrice: 85, totalPrice: 4080,
    sellerName: 'Medplus Victoria Island', sellerVerified: true,
    status: 'IN_TRANSIT',
    createdAt: '2026-05-30T09:14:00Z',
    escrowAmount: 4080,
    deliveryAddress: 'My Pharmacy, 5 Ozumba Mbadiwe, VI',
    distance: 1.2,
    timeline: [
      { status: 'PENDING',    label: 'Order placed',     time: '9:14 AM',  done: true  },
      { status: 'CONFIRMED',  label: 'Seller confirmed', time: '9:27 AM',  done: true  },
      { status: 'IN_TRANSIT', label: 'Out for delivery', time: '10:05 AM', done: true  },
      { status: 'DELIVERED',  label: 'Delivered',        time: '—',        done: false },
      { status: 'COMPLETED',  label: 'Payment released', time: '—',        done: false },
    ],
  },
  {
    id: 'O2', listingId: 'L3',
    drugName: 'Ciprofloxacin 500mg', quantity: 24, unit: 'Tabs', unitPrice: 145, totalPrice: 3480,
    sellerName: 'Lifemeds Lekki', sellerVerified: true,
    status: 'PENDING',
    createdAt: '2026-05-31T08:40:00Z',
    escrowAmount: 3480,
    deliveryAddress: 'My Pharmacy, 5 Ozumba Mbadiwe, VI',
    distance: 5.1,
    timeline: [
      { status: 'PENDING',    label: 'Order placed',     time: '8:40 AM', done: true  },
      { status: 'CONFIRMED',  label: 'Seller confirmed', time: '—',       done: false },
      { status: 'IN_TRANSIT', label: 'Out for delivery', time: '—',       done: false },
      { status: 'DELIVERED',  label: 'Delivered',        time: '—',       done: false },
      { status: 'COMPLETED',  label: 'Payment released', time: '—',       done: false },
    ],
  },
  {
    id: 'O3', listingId: 'L2',
    drugName: 'Ibuprofen 400mg', quantity: 120, unit: 'Tabs', unitPrice: 55, totalPrice: 6600,
    sellerName: 'HealthPlus Ikeja', sellerVerified: true,
    status: 'COMPLETED',
    createdAt: '2026-05-28T14:22:00Z',
    escrowAmount: 6600,
    deliveryAddress: 'My Pharmacy, 5 Ozumba Mbadiwe, VI',
    distance: 3.4,
    timeline: [
      { status: 'PENDING',    label: 'Order placed',     time: '2:22 PM', done: true },
      { status: 'CONFIRMED',  label: 'Seller confirmed', time: '2:35 PM', done: true },
      { status: 'IN_TRANSIT', label: 'Out for delivery', time: '3:10 PM', done: true },
      { status: 'DELIVERED',  label: 'Delivered',        time: '4:05 PM', done: true },
      { status: 'COMPLETED',  label: 'Payment released', time: '4:10 PM', done: true },
    ],
  },
  {
    id: 'O4', listingId: 'L5',
    drugName: 'Omeprazole 20mg', quantity: 30, unit: 'Caps', unitPrice: 95, totalPrice: 2850,
    sellerName: 'Alpha Pharmacy Surulere', sellerVerified: false,
    status: 'DISPUTED',
    createdAt: '2026-05-27T11:05:00Z',
    escrowAmount: 2850,
    deliveryAddress: 'My Pharmacy, 5 Ozumba Mbadiwe, VI',
    distance: 4.7,
    timeline: [
      { status: 'PENDING',    label: 'Order placed',     time: 'May 27', done: true  },
      { status: 'CONFIRMED',  label: 'Seller confirmed', time: 'May 27', done: true  },
      { status: 'IN_TRANSIT', label: 'Out for delivery', time: 'May 28', done: true  },
      { status: 'DISPUTED',   label: 'Dispute raised',   time: 'May 29', done: true  },
      { status: 'COMPLETED',  label: 'Resolved',         time: '—',      done: false },
    ],
  },
]
