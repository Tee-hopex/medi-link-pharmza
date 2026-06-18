import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import type { AuthRequest } from '../../types'
import { ok } from '../../types'
import * as service from './analytics.service'
import type { Response, NextFunction } from 'express'

const router = Router()
router.use(requireAuth)
router.use(requireRole('MEDICAL', 'NON_MEDICAL'))

router.get('/dashboard', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(ok(await service.getDashboard(req.user!.id))) } catch (err) { next(err) }
})

router.get('/expiry-timeline', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(ok(await service.getExpiryTimeline(req.user!.id))) } catch (err) { next(err) }
})

router.get('/profit', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(ok(await service.getProfitAnalysis(req.user!.id))) } catch (err) { next(err) }
})

export default router
