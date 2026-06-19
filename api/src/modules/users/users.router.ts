import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.middleware'
import * as controller from './users.controller'

const router = Router()

router.use(requireAuth)
router.get('/me', controller.getMe)
router.patch('/me', controller.updateMe)
router.patch('/me/password', controller.updatePassword)
router.patch('/me/facility', controller.updateFacility)
router.post('/me/verification/submit', controller.submitVerification)

export default router
