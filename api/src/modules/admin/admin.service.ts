import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma'
import { env } from '../../config/env'

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
      role: true,
      profession: true,
      verificationLevel: true,
      createdAt: true,
      facility: { select: { name: true, city: true, state: true, licenseNumber: true, licenseDoc: true, verified: true } },
    },
    orderBy: { createdAt: 'desc' },
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
      title: 'Account Verified ✓',
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
