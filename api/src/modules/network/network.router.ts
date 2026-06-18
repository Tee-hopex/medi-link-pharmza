import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.middleware'
import type { AuthRequest } from '../../types'
import { ok, fail } from '../../types'
import * as service from './network.service'
import { prisma } from '../../lib/prisma'
import type { Response, NextFunction } from 'express'

const router = Router()
router.use(requireAuth)

router.get('/channels', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(ok(await service.getChannels(req.user!.id))) } catch (err) { next(err) }
})

router.post('/channels/:id/join', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(ok(await service.joinChannel(req.user!.id, req.params.id), 'Joined channel')) } catch (err) { next(err) }
})

router.get('/channels/:id/messages', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const msgs = await service.getMessages(req.user!.id, req.params.id, req.query.cursor as string)
    res.json(ok(msgs))
  } catch (err) {
    if (err instanceof Error && err.message === 'Not a member of this channel') { res.status(403).json(fail(err.message)); return }
    next(err)
  }
})

router.post('/channels/:id/messages', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // ANNOUNCEMENT channels are read-only for non-MEDICAL users
    const channel = await prisma.channel.findUnique({ where: { id: req.params.id }, select: { type: true } })
    if (channel?.type === 'ANNOUNCEMENT' && req.user!.role !== 'MEDICAL') {
      res.status(403).json(fail('Only medical professionals can post in announcement channels'))
      return
    }

    const msg = await service.sendMessage(req.user!.id, req.params.id, req.body.content, req.body.type)
    req.app.get('io')?.to(`channel:${req.params.id}`).emit('message:new', {
      id: msg.id,
      channelId: msg.channelId,
      content: msg.content,
      senderId: msg.senderId,
      senderName: `${(msg as any).sender.firstName} ${(msg as any).sender.lastName}`,
      createdAt: msg.createdAt.toISOString(),
    })
    res.status(201).json(ok(msg))
  } catch (err) {
    if (err instanceof Error && err.message === 'Not a member of this channel') { res.status(403).json(fail(err.message)); return }
    next(err)
  }
})

export default router
