import type { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import type { AuthRequest } from '../types'
import { fail } from '../types'

interface AccessTokenPayload {
  sub: string
  role: string
  verificationLevel: string
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json(fail('No token provided'))
    return
  }

  const token = header.split(' ')[1]
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload
    req.user = {
      id: payload.sub,
      role: payload.role as never,
      verificationLevel: payload.verificationLevel as never,
    }
    next()
  } catch {
    res.status(401).json(fail('Invalid or expired token'))
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json(fail('Insufficient permissions'))
      return
    }
    next()
  }
}

export function requireVerification(...levels: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !levels.includes(req.user.verificationLevel)) {
      res.status(403).json(fail('Account verification required for this action'))
      return
    }
    next()
  }
}
