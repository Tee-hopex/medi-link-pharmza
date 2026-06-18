import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.middleware'
import type { AuthRequest } from '../../types'
import { ok, fail } from '../../types'
import { prisma } from '../../lib/prisma'
import { paystack } from '../../lib/paystack'
import crypto from 'crypto'
import type { Response, NextFunction } from 'express'

const router = Router()
router.use(requireAuth)

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.id },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 30 } },
    })
    if (!wallet) { res.status(404).json(fail('Wallet not found')); return }
    res.json(ok(wallet))
  } catch (err) { next(err) }
})

router.post('/fund/initialize', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { email: true } })
    if (!user) { res.status(404).json(fail('User not found')); return }

    const { amount } = req.body
    if (!amount || amount < 100) { res.status(400).json(fail('Minimum amount is ₦100')); return }

    const reference = `ML-${crypto.randomBytes(8).toString('hex')}`
    const paystackData = await paystack.initializeTransaction(user.email, amount, reference)

    // Create pending transaction
    await prisma.walletTransaction.create({
      data: {
        walletId: (await prisma.wallet.findUnique({ where: { userId: req.user!.id } }))!.id,
        type: 'CREDIT',
        amount,
        description: 'Wallet funding',
        reference,
        status: 'PENDING',
      },
    })

    res.json(ok(paystackData, 'Payment initialized'))
  } catch (err) { next(err) }
})

router.post('/fund/verify', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reference } = req.body
    const tx = await prisma.walletTransaction.findUnique({ where: { reference } })
    if (!tx || tx.status !== 'PENDING') { res.status(400).json(fail('Invalid or already processed transaction')); return }

    const verified = await paystack.verifyTransaction(reference)
    if (verified.status !== 'success') { res.status(400).json(fail('Payment not successful')); return }

    await prisma.$transaction([
      prisma.walletTransaction.update({ where: { reference }, data: { status: 'COMPLETED' } }),
      prisma.wallet.update({ where: { id: tx.walletId }, data: { balance: { increment: tx.amount } } }),
    ])

    res.json(ok(null, 'Wallet funded successfully'))
  } catch (err) { next(err) }
})

router.post('/withdraw', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { amount, bankCode, accountNumber, accountName } = req.body
    if (!amount || !bankCode || !accountNumber || !accountName) {
      res.status(400).json(fail('amount, bankCode, accountNumber, and accountName are required'))
      return
    }
    if (amount < 100) { res.status(400).json(fail('Minimum withdrawal is ₦100')); return }

    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } })
    if (!wallet) { res.status(404).json(fail('Wallet not found')); return }
    if (wallet.balance < amount) { res.status(400).json(fail('Insufficient balance')); return }

    const reference = `WD-${crypto.randomBytes(8).toString('hex')}`

    // Create Paystack transfer recipient then initiate transfer
    const recipient = await paystack.createTransferRecipient({ name: accountName, accountNumber, bankCode })
    const transfer = await paystack.initiateTransfer({
      amount,
      recipientCode: recipient.recipient_code,
      reference,
      reason: 'PHARVA wallet withdrawal',
    })

    await prisma.$transaction([
      prisma.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: amount } } }),
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'DEBIT',
          amount,
          description: `Withdrawal to ${accountName}`,
          reference,
          status: 'PENDING',
          metadata: { bankCode, accountNumber, accountName, transferCode: transfer.transfer_code },
        },
      }),
    ])

    res.json(ok({ transferCode: transfer.transfer_code }, 'Withdrawal initiated'))
  } catch (err) { next(err) }
})

export default router
