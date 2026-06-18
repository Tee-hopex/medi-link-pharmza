import cron from 'node-cron'
import { prisma } from '../lib/prisma'

// Runs daily at 8am — checks for items expiring in 30, 60, 90 days
export function startExpiryAlertsJob() {
  cron.schedule('0 8 * * *', async () => {
    console.log('[cron] Running expiry alerts check...')

    const now = new Date()
    const thresholds = [30, 60, 90]

    for (const days of thresholds) {
      const cutoff = new Date()
      cutoff.setDate(now.getDate() + days)
      const from = new Date()
      from.setDate(now.getDate() + days - 1)

      const items = await prisma.inventoryItem.findMany({
        where: { expiryDate: { gte: from, lte: cutoff } },
        include: { user: { select: { id: true } } },
      })

      const notifications = items.map((item) => ({
        userId: item.userId,
        title: `Expiry Alert: ${item.name}`,
        body: `${item.name} (Batch: ${item.batchNumber || 'N/A'}) expires in ${days} days`,
        type: 'EXPIRY_ALERT' as const,
        data: { itemId: item.id, daysLeft: days },
      }))

      if (notifications.length > 0) {
        await prisma.notification.createMany({ data: notifications })
        console.log(`[cron] Created ${notifications.length} expiry notifications for ${days}-day threshold`)
      }
    }
  })

  console.log('[cron] Expiry alerts job scheduled (daily at 8am)')
}
