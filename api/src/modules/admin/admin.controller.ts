import type { Request, Response, NextFunction } from 'express'
import type { AuthRequest } from '../../types'
import { ok } from '../../types'
import * as adminService from './admin.service'

function handleErr(err: unknown, res: Response, next: NextFunction) {
  if (err instanceof Error) {
    res.status(400).json({ success: false, error: err.message }); return
  }
  next(err)
}

// ─── Setup ───────────────────────────────────────────────────────────────────

export async function setupAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = await adminService.createAdminAccount(req.body)
    res.status(201).json(ok(admin, 'Admin account created'))
  } catch (err) { handleErr(err, res, next) }
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export async function getStats(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.json(ok(await adminService.getPlatformStats()))
  } catch (err) { next(err) }
}

// ─── Verifications ───────────────────────────────────────────────────────────

export async function getPendingVerifications(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.json(ok(await adminService.listPendingVerifications()))
  } catch (err) { next(err) }
}

export async function approveVerification(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await adminService.approveVerification(req.params.userId)
    res.json(ok(null, 'Verification approved'))
  } catch (err) { handleErr(err, res, next) }
}

export async function rejectVerification(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await adminService.rejectVerification(req.params.userId, req.body.reason)
    res.json(ok(null, 'Verification rejected'))
  } catch (err) { handleErr(err, res, next) }
}

export async function setVerificationLevel(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await adminService.setVerificationLevel(req.params.userId, req.body.level)
    res.json(ok(null, 'Verification level updated'))
  } catch (err) { handleErr(err, res, next) }
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { role, verificationLevel } = req.query as Record<string, string>
    res.json(ok(await adminService.listAllUsers({ role, verificationLevel })))
  } catch (err) { next(err) }
}

export async function toggleUserActive(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await adminService.toggleUserActive(req.params.userId)
    res.json(ok(result, result.isActive ? 'User reactivated' : 'User suspended'))
  } catch (err) { handleErr(err, res, next) }
}

// ─── Listings ────────────────────────────────────────────────────────────────

export async function getAllListings(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status, search } = req.query as Record<string, string>
    res.json(ok(await adminService.listAllListings({ status, search })))
  } catch (err) { next(err) }
}

export async function removeListing(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await adminService.removeListing(req.params.listingId, req.body.reason)
    res.json(ok(null, 'Listing removed'))
  } catch (err) { handleErr(err, res, next) }
}

// ─── Disputes ────────────────────────────────────────────────────────────────

export async function getDisputedOrders(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.json(ok(await adminService.listDisputedOrders()))
  } catch (err) { next(err) }
}

export async function resolveDispute(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { resolution, notes } = req.body
    if (!['COMPLETED', 'CANCELLED'].includes(resolution)) {
      res.status(400).json({ success: false, error: 'resolution must be COMPLETED or CANCELLED' }); return
    }
    await adminService.resolveDispute(req.params.orderId, resolution, notes)
    res.json(ok(null, `Dispute resolved as ${resolution}`))
  } catch (err) { handleErr(err, res, next) }
}

// ─── Broadcast ───────────────────────────────────────────────────────────────

export async function broadcast(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { title, body, roles } = req.body
    if (!title || !body) {
      res.status(400).json({ success: false, error: 'title and body are required' }); return
    }
    const count = await adminService.broadcastNotification(title, body, roles)
    res.json(ok({ count }, `Notification sent to ${count} users`))
  } catch (err) { next(err) }
}
