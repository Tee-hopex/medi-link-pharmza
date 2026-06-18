import { Router } from 'express'
import { requireAuth, requireRole, requireVerification } from '../../middleware/auth.middleware'
import * as controller from './marketplace.controller'

const router = Router()
router.use(requireAuth)

// Anyone verified can browse; only MEDICAL/NON_MEDICAL with at least LEVEL_1 can list or remove
router.get('/', controller.list)
router.get('/:id', controller.getOne)
router.post('/', requireRole('MEDICAL', 'NON_MEDICAL'), requireVerification('LEVEL_1', 'LEVEL_2', 'LEVEL_3'), controller.create)
router.delete('/:id', requireRole('MEDICAL', 'NON_MEDICAL'), controller.remove)

export default router
