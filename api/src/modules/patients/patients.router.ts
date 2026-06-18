import { Router } from 'express'
import { requireAuth, requireRole } from '../../middleware/auth.middleware'
import type { AuthRequest } from '../../types'
import { ok, fail } from '../../types'
import { prisma } from '../../lib/prisma'
import type { Response, NextFunction } from 'express'

const router = Router()
router.use(requireAuth)
router.use(requireRole('MEDICAL'))

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patients = await prisma.patient.findMany({
      where: { pharmacistId: req.user!.id },
      include: { medications: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(ok(patients))
  } catch (err) { next(err) }
})

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patient = await prisma.patient.create({
      data: { ...req.body, pharmacistId: req.user!.id },
      include: { medications: true },
    })
    res.status(201).json(ok(patient, 'Patient added'))
  } catch (err) { next(err) }
})

router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patient = await prisma.patient.findFirst({
      where: { id: req.params.id, pharmacistId: req.user!.id },
      include: { medications: true },
    })
    if (!patient) { res.status(404).json(fail('Patient not found')); return }
    res.json(ok(patient))
  } catch (err) { next(err) }
})

router.patch('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patient = await prisma.patient.findFirst({ where: { id: req.params.id, pharmacistId: req.user!.id } })
    if (!patient) { res.status(404).json(fail('Patient not found')); return }
    const updated = await prisma.patient.update({ where: { id: req.params.id }, data: req.body, include: { medications: true } })
    res.json(ok(updated, 'Patient updated'))
  } catch (err) { next(err) }
})

router.post('/:id/medications', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patient = await prisma.patient.findFirst({ where: { id: req.params.id, pharmacistId: req.user!.id } })
    if (!patient) { res.status(404).json(fail('Patient not found')); return }
    const med = await prisma.medicationSchedule.create({
      data: { ...req.body, patientId: req.params.id, startDate: new Date(req.body.startDate) },
    })
    res.status(201).json(ok(med, 'Medication added'))
  } catch (err) { next(err) }
})

// Log a dose event (TAKEN / MISSED / SKIPPED)
router.post('/:id/medications/:medId/log', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patient = await prisma.patient.findFirst({ where: { id: req.params.id, pharmacistId: req.user!.id } })
    if (!patient) { res.status(404).json(fail('Patient not found')); return }

    const schedule = await prisma.medicationSchedule.findFirst({ where: { id: req.params.medId, patientId: req.params.id } })
    if (!schedule) { res.status(404).json(fail('Medication schedule not found')); return }

    const { status, doseTime, notes } = req.body
    if (!['TAKEN', 'MISSED', 'SKIPPED'].includes(status)) {
      res.status(400).json(fail('Status must be TAKEN, MISSED, or SKIPPED'))
      return
    }

    const log = await prisma.adherenceLog.create({
      data: { medicationScheduleId: req.params.medId, doseTime: new Date(doseTime), status, notes },
    })

    // Roll up adherence status on the schedule based on recent logs
    const recentLogs = await prisma.adherenceLog.findMany({
      where: { medicationScheduleId: req.params.medId },
      orderBy: { doseTime: 'desc' },
      take: 7,
    })
    const missedCount = recentLogs.filter(l => l.status === 'MISSED').length
    const adherence = missedCount >= 3 ? 'CRITICAL' : missedCount >= 1 ? 'MISSED' : 'ON_TRACK'
    await prisma.medicationSchedule.update({ where: { id: req.params.medId }, data: { adherence } })

    res.status(201).json(ok(log, 'Dose logged'))
  } catch (err) { next(err) }
})

// Fetch dose log history for a medication schedule
router.get('/:id/medications/:medId/logs', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patient = await prisma.patient.findFirst({ where: { id: req.params.id, pharmacistId: req.user!.id } })
    if (!patient) { res.status(404).json(fail('Patient not found')); return }

    const logs = await prisma.adherenceLog.findMany({
      where: { medicationScheduleId: req.params.medId },
      orderBy: { doseTime: 'desc' },
    })
    res.json(ok(logs))
  } catch (err) { next(err) }
})

export default router
