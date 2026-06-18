import { prisma } from '../../lib/prisma'

export async function getDashboard(userId: string) {
  const now = new Date()
  const in30 = new Date(); in30.setDate(now.getDate() + 30)
  const in90 = new Date(); in90.setDate(now.getDate() + 90)

  const [
    totalItems,
    totalValue,
    expiringSoon,
    expiringCritical,
    deadStockCount,
    activeListings,
    pendingOrders,
    completedOrders,
    wallet,
  ] = await Promise.all([
    prisma.inventoryItem.count({ where: { userId } }),
    prisma.inventoryItem.aggregate({ where: { userId }, _sum: { costPrice: true, quantity: true } }),
    prisma.inventoryItem.count({ where: { userId, expiryDate: { gte: now, lte: in90 } } }),
    prisma.inventoryItem.count({ where: { userId, expiryDate: { gte: now, lte: in30 } } }),
    prisma.inventoryItem.count({ where: { userId, isDeadStock: true } }),
    prisma.marketplaceListing.count({ where: { sellerId: userId, status: 'ACTIVE' } }),
    prisma.order.count({ where: { OR: [{ buyerId: userId }, { sellerId: userId }], status: 'PENDING' } }),
    prisma.order.count({ where: { OR: [{ buyerId: userId }, { sellerId: userId }], status: 'COMPLETED' } }),
    prisma.wallet.findUnique({ where: { userId }, select: { balance: true, escrow: true } }),
  ])

  return {
    inventory: {
      total: totalItems,
      totalValue: totalValue._sum.costPrice || 0,
      expiringSoon,
      expiringCritical,
      deadStock: deadStockCount,
    },
    marketplace: { activeListings },
    orders: { pending: pendingOrders, completed: completedOrders },
    wallet: wallet || { balance: 0, escrow: 0 },
  }
}

export async function getExpiryTimeline(userId: string) {
  const now = new Date()
  const buckets = [30, 60, 90]

  const results = await Promise.all(
    buckets.map(async (days) => {
      const from = days === 30 ? now : new Date(now.getTime() + (days - 30) * 24 * 60 * 60 * 1000)
      const to = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
      const count = await prisma.inventoryItem.count({ where: { userId, expiryDate: { gte: from, lte: to } } })
      return { label: `${days} days`, count }
    }),
  )

  return results
}

export async function getProfitAnalysis(userId: string) {
  const items = await prisma.inventoryItem.findMany({ where: { userId } })

  const totalCostValue = items.reduce((sum, i) => sum + i.costPrice * i.quantity, 0)
  const totalSellingValue = items.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0)
  const potentialProfit = totalSellingValue - totalCostValue

  const now = new Date()
  const expired = items.filter((i) => i.expiryDate < now)
  const expiryLoss = expired.reduce((sum, i) => sum + i.costPrice * i.quantity, 0)

  return { totalCostValue, totalSellingValue, potentialProfit, expiryLoss }
}
