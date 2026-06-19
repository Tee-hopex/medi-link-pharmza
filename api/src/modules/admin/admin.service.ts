import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma'
import { env } from '../../config/env'

// ─── Stats ───────────────────────────────────────────────────────────────────

export async function getPlatformStats() {
  const [
    totalUsers,
    usersByRole,
    totalListings,
    listingsByStatus,
    totalOrders,
    ordersByStatus,
    pendingVerifications,
    disputedOrders,
    revenue,
    newUsersThisWeek,
  ] = await Promise.all([
    prisma.user.count({ where: { role: { not: 'ADMIN' } } }),
    prisma.user.groupBy({ by: ['role'], where: { role: { not: 'ADMIN' } }, _count: true }),
    prisma.marketplaceListing.count(),
    prisma.marketplaceListing.groupBy({ by: ['status'], _count: true }),
    prisma.order.count(),
    prisma.order.groupBy({ by: ['status'], _count: true }),
    prisma.user.count({ where: { verificationLevel: 'PENDING' } }),
    prisma.order.count({ where: { status: 'DISPUTED' } }),
    prisma.order.aggregate({ where: { status: 'COMPLETED' }, _sum: { totalPrice: true } }),
    prisma.user.count({
      where: {
        role: { not: 'ADMIN' },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ])

  return {
    users: {
      total: totalUsers,
      newThisWeek: newUsersThisWeek,
      byRole: Object.fromEntries(usersByRole.map((r) => [r.role, r._count])),
    },
    listings: {
      total: totalListings,
      byStatus: Object.fromEntries(listingsByStatus.map((r) => [r.status, r._count])),
    },
    orders: {
      total: totalOrders,
      byStatus: Object.fromEntries(ordersByStatus.map((r) => [r.status, r._count])),
    },
    pendingVerifications,
    disputedOrders,
    revenue: revenue._sum.totalPrice ?? 0,
  }
}

// ─── Verifications ───────────────────────────────────────────────────────────

export async function listPendingVerifications() {
  return prisma.user.findMany({
    where: { verificationLevel: 'PENDING' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      profession: true,
      verificationLevel: true,
      createdAt: true,
      facility: true,
    },
    orderBy: { updatedAt: 'asc' },
  })
}

export async function approveVerification(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')
  if (user.verificationLevel !== 'PENDING') throw new Error('User is not in PENDING state')

  await prisma.user.update({ where: { id: userId }, data: { verificationLevel: 'LEVEL_1' } })
  await prisma.facility.updateMany({ where: { userId }, data: { verified: true } })
  await prisma.notification.create({
    data: {
      userId,
      title: 'Account Verified',
      body: 'Your account has been verified (Level 1). You can now list drugs on the marketplace.',
      type: 'SYSTEM',
    },
  })
}

export async function rejectVerification(userId: string, reason?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  await prisma.user.update({ where: { id: userId }, data: { verificationLevel: 'UNVERIFIED' } })
  await prisma.notification.create({
    data: {
      userId,
      title: 'Verification Not Approved',
      body: reason || 'Your verification request was not approved. Please update your information and try again.',
      type: 'SYSTEM',
    },
  })
}

export async function setVerificationLevel(userId: string, level: string) {
  const valid = ['UNVERIFIED', 'LEVEL_1', 'LEVEL_2', 'LEVEL_3']
  if (!valid.includes(level)) throw new Error('Invalid verification level')

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  await prisma.user.update({ where: { id: userId }, data: { verificationLevel: level as never } })

  if (['LEVEL_1', 'LEVEL_2', 'LEVEL_3'].includes(level)) {
    await prisma.facility.updateMany({ where: { userId }, data: { verified: true } })
    await prisma.notification.create({
      data: {
        userId,
        title: `Account Level Updated`,
        body: `Your account has been set to ${level.replace('_', ' ')} by an administrator.`,
        type: 'SYSTEM',
      },
    })
  }
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function listAllUsers(filters: { role?: string; verificationLevel?: string }) {
  return prisma.user.findMany({
    where: {
      role: { not: 'ADMIN' },
      ...(filters.role && { role: filters.role as never }),
      ...(filters.verificationLevel && { verificationLevel: filters.verificationLevel as never }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      profession: true,
      verificationLevel: true,
      isActive: true,
      createdAt: true,
      facility: { select: { name: true, city: true, state: true, licenseNumber: true, licenseDoc: true, verified: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function toggleUserActive(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
    select: { id: true, isActive: true },
  })

  await prisma.notification.create({
    data: {
      userId,
      title: updated.isActive ? 'Account Reactivated' : 'Account Suspended',
      body: updated.isActive
        ? 'Your account has been reactivated by an administrator.'
        : 'Your account has been suspended. Please contact support for more information.',
      type: 'SYSTEM',
    },
  })

  return updated
}

// ─── Listings ────────────────────────────────────────────────────────────────

export async function listAllListings(filters: { status?: string; search?: string }) {
  return prisma.marketplaceListing.findMany({
    where: {
      ...(filters.status && { status: filters.status as never }),
      ...(filters.search && {
        OR: [
          { drugName: { contains: filters.search, mode: 'insensitive' } },
          { genericName: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    },
    include: {
      seller: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          facility: { select: { name: true, city: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 150,
  })
}

export async function removeListing(listingId: string, reason?: string) {
  const listing = await prisma.marketplaceListing.findUnique({ where: { id: listingId } })
  if (!listing) throw new Error('Listing not found')

  await prisma.marketplaceListing.update({
    where: { id: listingId },
    data: { status: 'CANCELLED' },
  })

  await prisma.notification.create({
    data: {
      userId: listing.sellerId,
      title: 'Listing Removed',
      body: reason || 'Your listing has been removed by an administrator.',
      type: 'SYSTEM',
    },
  })
}

// ─── Disputes ────────────────────────────────────────────────────────────────

export async function listDisputedOrders() {
  return prisma.order.findMany({
    where: { status: 'DISPUTED' },
    include: {
      buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
      seller: { select: { id: true, firstName: true, lastName: true, email: true } },
      listing: { select: { drugName: true, unit: true } },
      timeline: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
    orderBy: { updatedAt: 'asc' },
  })
}

export async function resolveDispute(orderId: string, resolution: 'COMPLETED' | 'CANCELLED', notes?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw new Error('Order not found')
  if (order.status !== 'DISPUTED') throw new Error('Order is not disputed')

  await prisma.order.update({ where: { id: orderId }, data: { status: resolution } })
  await prisma.orderEvent.create({
    data: {
      orderId,
      status: resolution,
      description: notes ? `Admin resolution: ${notes}` : `Dispute resolved by admin — ${resolution}`,
      actor: 'ADMIN',
    },
  })

  const msg =
    resolution === 'COMPLETED'
      ? 'Your order dispute has been resolved. The order is marked as completed.'
      : 'Your order dispute has been resolved. The order has been cancelled.'

  await prisma.notification.createMany({
    data: [
      { userId: order.buyerId, title: 'Dispute Resolved', body: msg, type: 'ORDER_UPDATE' },
      { userId: order.sellerId, title: 'Dispute Resolved', body: msg, type: 'ORDER_UPDATE' },
    ],
  })
}

// ─── Broadcast ───────────────────────────────────────────────────────────────

export async function broadcastNotification(title: string, body: string, roles?: string[]) {
  const roleFilter = roles?.length ? { role: { in: roles as never[] } } : { role: { not: 'ADMIN' as never } }

  const users = await prisma.user.findMany({
    where: { ...roleFilter, isActive: true },
    select: { id: true },
  })

  await prisma.notification.createMany({
    data: users.map((u) => ({ userId: u.id, title, body, type: 'SYSTEM' as const })),
  })

  return users.length
}

// ─── Admin setup ─────────────────────────────────────────────────────────────

export async function createAdminAccount(data: {
  email: string
  password: string
  firstName: string
  lastName: string
  adminSecret: string
}) {
  if (data.adminSecret !== env.ADMIN_SECRET) throw new Error('Invalid admin secret')

  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) throw new Error('Email already in use')

  const passwordHash = await bcrypt.hash(data.password, 12)
  const admin = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'ADMIN',
      verificationLevel: 'LEVEL_3',
      wallet: { create: { balance: 0, escrow: 0 } },
    },
  })

  const { passwordHash: _, ...safe } = admin
  return safe
}
