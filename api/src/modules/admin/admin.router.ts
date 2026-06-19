import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import * as controller from './admin.controller'

const router = Router()

// Bootstrap — no JWT, guarded by ADMIN_SECRET in body
router.post('/setup', controller.setupAdmin)

// All routes below require auth + ADMIN role
router.use(requireAuth, requireRole('ADMIN'))

// Stats
router.get('/stats', controller.getStats)

// Verifications
router.get('/verifications', controller.getPendingVerifications)
router.patch('/verifications/:userId/approve', controller.approveVerification)
router.patch('/verifications/:userId/reject', controller.rejectVerification)
router.patch('/verifications/:userId/level', controller.setVerificationLevel)

// Users
router.get('/users', controller.getAllUsers)
router.patch('/users/:userId/toggle-active', controller.toggleUserActive)

// Listings
router.get('/listings', controller.getAllListings)
router.patch('/listings/:listingId/remove', controller.removeListing)

// Disputes
router.get('/disputes', controller.getDisputedOrders)
router.patch('/disputes/:orderId/resolve', controller.resolveDispute)

// Broadcast
router.post('/broadcast', controller.broadcast)

export default router
