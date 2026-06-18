import { prisma } from '../../lib/prisma'

export async function getListings(filters: {
  search?: string
  category?: string
  urgentOnly?: boolean
  sellerId?: string
}) {
  const where: Record<string, unknown> = { status: 'ACTIVE', expiryDate: { gte: new Date() } }

  if (filters.search) {
    where.OR = [
      { drugName: { contains: filters.search, mode: 'insensitive' } },
      { genericName: { contains: filters.search, mode: 'insensitive' } },
    ]
  }
  if (filters.category) where.category = filters.category
  if (filters.urgentOnly) where.isUrgent = true
  if (filters.sellerId) where.sellerId = filters.sellerId

  return prisma.marketplaceListing.findMany({
    where,
    include: {
      seller: { select: { id: true, firstName: true, lastName: true, facility: { select: { name: true, city: true, verified: true } } } },
    },
    orderBy: [{ isUrgent: 'desc' }, { expiryDate: 'asc' }],
  })
}

export async function getListing(id: string) {
  const listing = await prisma.marketplaceListing.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, firstName: true, lastName: true, facility: true } },
    },
  })
  if (!listing) throw new Error('Listing not found')
  return listing
}

export async function createListing(sellerId: string, data: {
  drugName: string
  genericName?: string
  category?: string
  quantity: number
  unit: string
  askingPrice: number
  originalPrice?: number
  expiryDate: string
  description?: string
  isUrgent?: boolean
  inventoryItemId?: string
}) {
  return prisma.marketplaceListing.create({
    data: {
      ...data,
      sellerId,
      expiryDate: new Date(data.expiryDate),
    },
    include: { seller: { select: { id: true, firstName: true, lastName: true } } },
  })
}

export async function deleteListing(sellerId: string, id: string) {
  const listing = await prisma.marketplaceListing.findFirst({ where: { id, sellerId } })
  if (!listing) throw new Error('Listing not found')
  await prisma.marketplaceListing.update({ where: { id }, data: { status: 'CANCELLED' } })
}
