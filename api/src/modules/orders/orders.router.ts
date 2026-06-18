import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.middleware'
import * as controller from './orders.controller'

const router = Router()
router.use(requireAuth)

router.get('/', controller.list)
router.post('/', controller.create)
router.get('/:id', controller.getOne)
router.patch('/:id/status', controller.updateStatus)

export default router
