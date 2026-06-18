import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.middleware'
import type { AuthRequest } from '../../types'
import { ok, fail } from '../../types'
import * as service from './pharmacies.service'
import type { Response, NextFunction } from 'express'

const router = Router()
router.use(requireAuth)

router.get('/nearby', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { lat, lon, radius } = req.query
    if (!lat || !lon) { res.status(400).json(fail('lat and lon are required')); return }
    const results = await service.getNearby(parseFloat(lat as string), parseFloat(lon as string), radius ? parseFloat(radius as string) : 10)
    res.json(ok(results))
  } catch (err) { next(err) }
})

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pharmacy = await service.getPharmacy(req.params.id)
    res.json(ok(pharmacy))
  } catch (err) {
    if (err instanceof Error && err.message === 'Pharmacy not found') { res.status(404).json(fail(err.message)); return }
    next(err)
  }
})

export default router
