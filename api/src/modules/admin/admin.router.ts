import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import * as controller from './admin.controller'

const router = Router()

// Bootstrap — no JWT required, guarded by ADMIN_SECRET in body
router.post('/setup', controller.setupAdmin)

// All routes below require auth + ADMIN role
router.use(requireAuth, requireRole('ADMIN'))

router.get('/verifications', controller.getPendingVerifications)
router.patch('/verifications/:userId/approve', controller.approveVerification)
router.patch('/verifications/:userId/reject', controller.rejectVerification)
router.get('/users', controller.getAllUsers)

export default router
