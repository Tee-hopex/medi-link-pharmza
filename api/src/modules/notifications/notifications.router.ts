import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.middleware'
import type { AuthRequest } from '../../types'
import { ok, fail } from '../../types'
import { prisma } from '../../lib/prisma'
import type { Response, NextFunction } from 'express'

const router = Router()
router.use(requireAuth)

// Fetch user notifications (unread first, paginated)
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50)
    const cursor = req.query.cursor as string | undefined

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.id, isRead: false },
    })

    res.json(ok({ notifications, unreadCount, nextCursor: notifications[notifications.length - 1]?.id ?? null }))
  } catch (err) { next(err) }
})

// Mark a single notification as read
router.patch('/:id/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    })
    if (!notification) { res.status(404).json(fail('Notification not found')); return }

    await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } })
    res.json(ok(null, 'Marked as read'))
  } catch (err) { next(err) }
})

// Mark all notifications as read
router.patch('/read-all', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    })
    res.json(ok(null, 'All notifications marked as read'))
  } catch (err) { next(err) }
})

export default router
