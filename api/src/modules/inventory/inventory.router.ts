import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import * as controller from './inventory.controller'

const router = Router()
router.use(requireAuth)
router.use(requireRole('MEDICAL', 'NON_MEDICAL'))

router.get('/', controller.list)
router.post('/', controller.create)
router.get('/expiry-alerts', controller.expiryAlerts)
router.get('/dead-stock', controller.deadStock)
router.get('/:id', controller.getOne)
router.patch('/:id', controller.update)
router.delete('/:id', controller.remove)

export default router
