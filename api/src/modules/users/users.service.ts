import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma'

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { facility: true, wallet: { select: { balance: true, escrow: true, currency: true } } },
  })
  if (!user) throw new Error('User not found')
  const { passwordHash: _, ...safe } = user
  return safe
}

export async function updateMe(userId: string, data: {
  firstName?: string
  lastName?: string
  phone?: string
  profession?: string
  specialty?: string
  avatar?: string
}) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    include: { facility: true },
  })
  const { passwordHash: _, ...safe } = user
  return safe
}

export async function updatePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) throw new Error('Current password is incorrect')

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
}

export async function updateFacility(userId: string, data: {
  name?: string
  address?: string
  city?: string
  state?: string
  latitude?: number
  longitude?: number
  licenseNumber?: string
}) {
  return prisma.facility.upsert({
    where: { userId },
    create: {
      userId,
      name: data.name || '',
      type: 'COMMUNITY_PHARMACY',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      ...data,
    },
    update: data,
  })
}
