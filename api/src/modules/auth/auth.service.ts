import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { prisma } from '../../lib/prisma'
import { env } from '../../config/env'
import type { RegisterInput, LoginInput } from './auth.schema'

function signAccess(userId: string, role: string, verificationLevel: string) {
  return jwt.sign({ sub: userId, role, verificationLevel }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as never,
  })
}

function signRefresh(userId: string) {
  return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as never,
  })
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new Error('Email already in use')

  const passwordHash = await bcrypt.hash(input.password, 12)

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: input.role,
      profession: input.profession,
      specialty: input.specialty,
      verificationLevel: 'UNVERIFIED',
      facility:
        input.facilityName && input.facilityType
          ? {
              create: {
                name: input.facilityName,
                type: input.facilityType,
                address: input.facilityAddress || '',
                city: input.facilityCity || '',
                state: input.facilityState || '',
                licenseNumber: input.licenseNumber,
              },
            }
          : undefined,
      wallet: { create: { balance: 0, escrow: 0 } },
    },
    include: { facility: true, wallet: true },
  })

  const accessToken = signAccess(user.id, user.role, user.verificationLevel)
  const refreshToken = signRefresh(user.id)

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  const { passwordHash: _, ...safeUser } = user
  return { user: safeUser, accessToken, refreshToken }
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { facility: true, wallet: true },
  })

  if (!user) throw new Error('Invalid email or password')
  if (!user.isActive) throw new Error('Account is deactivated')

  const valid = await bcrypt.compare(input.password, user.passwordHash)
  if (!valid) throw new Error('Invalid email or password')

  const accessToken = signAccess(user.id, user.role, user.verificationLevel)
  const refreshToken = signRefresh(user.id)

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  const { passwordHash: _, ...safeUser } = user
  return { user: safeUser, accessToken, refreshToken }
}

export async function refresh(token: string) {
  const stored = await prisma.refreshToken.findUnique({ where: { token } })
  if (!stored || stored.expiresAt < new Date()) {
    throw new Error('Invalid or expired refresh token')
  }

  let payload: { sub: string }
  try {
    payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string }
  } catch {
    throw new Error('Invalid refresh token')
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user) throw new Error('User not found')

  // Rotate refresh token
  await prisma.refreshToken.delete({ where: { token } })
  const newRefresh = signRefresh(user.id)
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: newRefresh,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  const accessToken = signAccess(user.id, user.role, user.verificationLevel)
  return { accessToken, refreshToken: newRefresh }
}

export async function logout(token: string) {
  await prisma.refreshToken.deleteMany({ where: { token } })
}
