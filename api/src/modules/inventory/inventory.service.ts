import { prisma } from '../../lib/prisma'

export async function getInventory(userId: string, filters: {
  search?: string
  category?: string
  expiringInDays?: number
  deadStockOnly?: boolean
}) {
  const where: Record<string, unknown> = { userId }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { genericName: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (filters.category) where.category = filters.category
  if (filters.deadStockOnly) where.isDeadStock = true

  if (filters.expiringInDays) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + filters.expiringInDays)
    where.expiryDate = { lte: cutoff, gte: new Date() }
  }

  return prisma.inventoryItem.findMany({
    where,
    orderBy: { expiryDate: 'asc' },
  })
}

export async function getItem(userId: string, itemId: string) {
  const item = await prisma.inventoryItem.findFirst({ where: { id: itemId, userId } })
  if (!item) throw new Error('Item not found')
  return item
}

export async function createItem(userId: string, data: {
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
}) {
  return prisma.inventoryItem.create({
    data: {
      ...data,
      userId,
      expiryDate: new Date(data.expiryDate),
      manufactureDate: data.manufactureDate ? new Date(data.manufactureDate) : undefined,
    },
  })
}

export async function updateItem(userId: string, itemId: string, data: Partial<ReturnType<typeof createItem>>) {
  const item = await prisma.inventoryItem.findFirst({ where: { id: itemId, userId } })
  if (!item) throw new Error('Item not found')
  return prisma.inventoryItem.update({ where: { id: itemId }, data })
}

export async function deleteItem(userId: string, itemId: string) {
  const item = await prisma.inventoryItem.findFirst({ where: { id: itemId, userId } })
  if (!item) throw new Error('Item not found')
  await prisma.inventoryItem.delete({ where: { id: itemId } })
}

export async function getExpiryAlerts(userId: string) {
  const now = new Date()
  const in90 = new Date(); in90.setDate(now.getDate() + 90)

  const items = await prisma.inventoryItem.findMany({
    where: { userId, expiryDate: { gte: now, lte: in90 } },
    orderBy: { expiryDate: 'asc' },
  })

  return items.map((item) => {
    const daysLeft = Math.ceil((item.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const urgency = daysLeft <= 30 ? 'critical' : daysLeft <= 60 ? 'warning' : 'info'
    return { ...item, daysLeft, urgency }
  })
}

export async function detectDeadStock(userId: string) {
  // Items not sold/moved in 90 days with quantity > 0 are considered dead stock
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)

  const items = await prisma.inventoryItem.findMany({
    where: { userId, quantity: { gt: 0 }, updatedAt: { lte: cutoff } },
  })

  // Mark them as dead stock
  await prisma.inventoryItem.updateMany({
    where: { id: { in: items.map((i) => i.id) } },
    data: { isDeadStock: true },
  })

  return items
}
