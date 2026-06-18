import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import type { AuthRequest } from '../../types'
import { ok } from '../../types'
import { prisma } from '../../lib/prisma'
import type { Response, NextFunction } from 'express'

const router = Router()
router.use(requireAuth)

// All authenticated users can broadcast (patients included)
router.post('/broadcast', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { drugName, quantity, unit, urgency, latitude, longitude, radius } = req.body

    const request = await prisma.emergencyRxRequest.create({
      data: {
        requesterId: req.user!.id,
        drugName,
        quantity,
        unit,
        urgency,
        latitude,
        longitude,
        radius: radius || 10,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hour TTL
      },
    })

    // Emit to socket room for real-time delivery (handled in sockets/index.ts)
    req.app.get('io')?.to('emergency-rx').emit('emergency:new', {
      id: request.id,
      drugName,
      quantity,
      unit,
      urgency,
      latitude,
      longitude,
      radius: request.radius,
    })

    res.status(201).json(ok(request, 'Emergency request broadcast sent'))
  } catch (err) { next(err) }
})

// Only MEDICAL/NON_MEDICAL can respond with stock
router.post('/:id/respond', requireRole('MEDICAL', 'NON_MEDICAL'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { pharmacyName, quantity, price, eta } = req.body
    const response = await prisma.emergencyRxResponse.create({
      data: {
        requestId: req.params.id,
        responderId: req.user!.id,
        pharmacyName,
        quantity,
        price,
        eta,
      },
    })

    const request = await prisma.emergencyRxRequest.findUnique({ where: { id: req.params.id } })
    req.app.get('io')?.to(`user:${request?.requesterId}`).emit('emergency:response', response)

    res.status(201).json(ok(response, 'Response sent'))
  } catch (err) { next(err) }
})

router.get('/:id/responses', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const responses = await prisma.emergencyRxResponse.findMany({
      where: { requestId: req.params.id },
      orderBy: { createdAt: 'asc' },
    })
    res.json(ok(responses))
  } catch (err) { next(err) }
})

export default router
