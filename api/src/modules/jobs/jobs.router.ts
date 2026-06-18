import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import type { AuthRequest } from '../../types'
import { ok, fail } from '../../types'
import { prisma } from '../../lib/prisma'
import type { Response, NextFunction } from 'express'

const router = Router()
router.use(requireAuth)

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, location, search } = req.query
    const where: Record<string, unknown> = { isActive: true }
    if (type) where.type = type
    if (location) where.location = { contains: location, mode: 'insensitive' }
    if (search) where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { facility: { contains: search, mode: 'insensitive' } },
    ]

    const jobs = await prisma.job.findMany({
      where,
      include: { poster: { select: { id: true, firstName: true, lastName: true, facility: { select: { name: true, city: true } } } } },
      orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
    })
    res.json(ok(jobs))
  } catch (err) { next(err) }
})

router.post('/', requireRole('MEDICAL', 'NON_MEDICAL'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const job = await prisma.job.create({
      data: { ...req.body, posterId: req.user!.id },
      include: { poster: { select: { id: true, firstName: true, lastName: true } } },
    })
    res.status(201).json(ok(job, 'Job posted'))
  } catch (err) { next(err) }
})

router.delete('/:id', requireRole('MEDICAL', 'NON_MEDICAL'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const job = await prisma.job.findFirst({ where: { id: req.params.id, posterId: req.user!.id } })
    if (!job) { res.status(404).json(fail('Job not found')); return }
    await prisma.job.update({ where: { id: req.params.id }, data: { isActive: false } })
    res.json(ok(null, 'Job removed'))
  } catch (err) { next(err) }
})

// Apply for a job (any authenticated user can apply)
router.post('/:id/apply', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const job = await prisma.job.findFirst({ where: { id: req.params.id, isActive: true } })
    if (!job) { res.status(404).json(fail('Job not found or no longer active')); return }
    if (job.posterId === req.user!.id) { res.status(400).json(fail('Cannot apply to your own job posting')); return }

    const existing = await prisma.jobApplication.findUnique({
      where: { jobId_applicantId: { jobId: req.params.id, applicantId: req.user!.id } },
    })
    if (existing) { res.status(409).json(fail('You have already applied to this job')); return }

    const application = await prisma.jobApplication.create({
      data: { jobId: req.params.id, applicantId: req.user!.id, coverMessage: req.body.coverMessage },
      include: { applicant: { select: { id: true, firstName: true, lastName: true, role: true } } },
    })
    res.status(201).json(ok(application, 'Application submitted'))
  } catch (err) { next(err) }
})

// List applications for a job (poster only)
router.get('/:id/applications', requireRole('MEDICAL', 'NON_MEDICAL'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const job = await prisma.job.findFirst({ where: { id: req.params.id, posterId: req.user!.id } })
    if (!job) { res.status(403).json(fail('Only the job poster can view applications')); return }

    const applications = await prisma.jobApplication.findMany({
      where: { jobId: req.params.id },
      include: { applicant: { select: { id: true, firstName: true, lastName: true, role: true, facility: { select: { name: true, city: true } } } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(ok(applications))
  } catch (err) { next(err) }
})

// Accept or reject an application (poster only)
router.patch('/:id/applications/:appId', requireRole('MEDICAL', 'NON_MEDICAL'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const job = await prisma.job.findFirst({ where: { id: req.params.id, posterId: req.user!.id } })
    if (!job) { res.status(403).json(fail('Only the job poster can update applications')); return }

    const { status } = req.body
    if (!['ACCEPTED', 'REJECTED'].includes(status)) { res.status(400).json(fail('Status must be ACCEPTED or REJECTED')); return }

    const application = await prisma.jobApplication.update({
      where: { id: req.params.appId },
      data: { status },
      include: { applicant: { select: { id: true, firstName: true, lastName: true } } },
    })
    res.json(ok(application, `Application ${status.toLowerCase()}`))
  } catch (err) { next(err) }
})

export default router
