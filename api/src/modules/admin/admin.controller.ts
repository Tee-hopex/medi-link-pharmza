import type { Request, Response, NextFunction } from 'express'
import type { AuthRequest } from '../../types'
import { ok } from '../../types'
import * as adminService from './admin.service'

export async function setupAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = await adminService.createAdminAccount(req.body)
    res.status(201).json(ok(admin, 'Admin account created'))
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json({ success: false, error: err.message }); return
    }
    next(err)
  }
}

export async function getPendingVerifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const users = await adminService.listPendingVerifications()
    res.json(ok(users))
  } catch (err) { next(err) }
}

export async function getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { role, verificationLevel } = req.query as Record<string, string>
    const users = await adminService.listAllUsers({ role, verificationLevel })
    res.json(ok(users))
  } catch (err) { next(err) }
}

export async function approveVerification(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await adminService.approveVerification(req.params.userId)
    res.json(ok(null, 'Verification approved'))
  } catch (err) {
    if (err instanceof Error && (err.message === 'User not found' || err.message === 'User is not in PENDING state')) {
      res.status(400).json({ success: false, error: err.message }); return
    }
    next(err)
  }
}

export async function rejectVerification(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await adminService.rejectVerification(req.params.userId, req.body.reason)
    res.json(ok(null, 'Verification rejected'))
  } catch (err) {
    if (err instanceof Error && err.message === 'User not found') {
      res.status(400).json({ success: false, error: err.message }); return
    }
    next(err)
  }
}
