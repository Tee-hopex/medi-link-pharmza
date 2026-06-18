import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '../../types'
import { ok } from '../../types'
import * as usersService from './users.service'

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getMe(req.user!.id)
    res.json(ok(user))
  } catch (err) { next(err) }
}

export async function updateMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.updateMe(req.user!.id, req.body)
    res.json(ok(user, 'Profile updated'))
  } catch (err) { next(err) }
}

export async function updatePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body
    await usersService.updatePassword(req.user!.id, currentPassword, newPassword)
    res.json(ok(null, 'Password updated'))
  } catch (err) {
    if (err instanceof Error && err.message === 'Current password is incorrect') {
      res.status(400).json({ success: false, error: err.message }); return
    }
    next(err)
  }
}

export async function updateFacility(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const facility = await usersService.updateFacility(req.user!.id, req.body)
    res.json(ok(facility, 'Facility updated'))
  } catch (err) { next(err) }
}
