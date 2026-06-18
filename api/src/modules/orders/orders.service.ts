import { prisma } from '../../lib/prisma'
import type { OrderStatus } from '@prisma/client'

export async function getOrders(userId: string, role: 'buyer' | 'seller' | 'all' = 'all') {
  const where = role === 'buyer' ? { buyerId: userId }
    : role === 'seller' ? { sellerId: userId }
    : { OR: [{ buyerId: userId }, { sellerId: userId }] }

  return prisma.order.findMany({
    where,
    include: {
      timeline: { orderBy: { createdAt: 'asc' } },
      buyer: { select: { id: true, firstName: true, lastName: true } },
      seller: { select: { id: true, firstName: true, lastName: true, facility: { select: { name: true } } } },
      listing: { select: { id: true, drugName: true, images: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getOrder(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, OR: [{ buyerId: userId }, { sellerId: userId }] },
    include: {
      timeline: { orderBy: { createdAt: 'asc' } },
      buyer: { select: { id: true, firstName: true, lastName: true } },
      seller: { select: { id: true, firstName: true, lastName: true, facility: true } },
      listing: true,
    },
  })
  if (!order) throw new Error('Order not found')
  return order
}

export async function createOrder(buyerId: string, data: {
  listingId: string
  quantity: number
  deliveryAddress?: string
  notes?: string
}) {
  const listing = await prisma.marketplaceListing.findUnique({ where: { id: data.listingId } })
  if (!listing || listing.status !== 'ACTIVE') throw new Error('Listing not available')
  if (listing.sellerId === buyerId) throw new Error('Cannot purchase your own listing')
  if (data.quantity > listing.quantity) throw new Error('Insufficient quantity')

  const totalPrice = data.quantity * listing.askingPrice
  const escrowAmount = totalPrice

  const order = await prisma.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        buyerId,
        sellerId: listing.sellerId,
        listingId: listing.id,
        drugName: listing.drugName,
        quantity: data.quantity,
        unit: listing.unit,
        unitPrice: listing.askingPrice,
        totalPrice,
        escrowAmount,
        deliveryAddress: data.deliveryAddress,
        notes: data.notes,
        status: 'PENDING',
        timeline: { create: { status: 'PENDING', description: 'Order placed', actor: 'buyer' } },
      },
      include: { timeline: true },
    })

    // Reserve listing if fully purchased
    if (data.quantity === listing.quantity) {
      await tx.marketplaceListing.update({ where: { id: listing.id }, data: { status: 'RESERVED' } })
    }

    // Hold escrow
    await tx.wallet.update({
      where: { userId: buyerId },
      data: { balance: { decrement: escrowAmount }, escrow: { increment: escrowAmount } },
    })

    return o
  })

  return order
}

const STATUS_FLOW: Record<string, OrderStatus> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'IN_TRANSIT',
  IN_TRANSIT: 'DELIVERED',
  DELIVERED: 'COMPLETED',
}

export async function updateOrderStatus(userId: string, orderId: string, status: OrderStatus, description?: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId } })
  if (!order) throw new Error('Order not found')

  const isBuyer = order.buyerId === userId
  const isSeller = order.sellerId === userId
  if (!isBuyer && !isSeller) throw new Error('Unauthorized')

  const expectedNext = STATUS_FLOW[order.status]
  if (status !== 'CANCELLED' && status !== 'DISPUTED' && status !== expectedNext) {
    throw new Error(`Cannot transition from ${order.status} to ${status}`)
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status,
        timeline: {
          create: {
            status,
            description: description || `Order ${status.toLowerCase()}`,
            actor: isBuyer ? 'buyer' : 'seller',
          },
        },
      },
      include: { timeline: { orderBy: { createdAt: 'asc' } } },
    })

    // Release escrow on completion
    if (status === 'COMPLETED') {
      await tx.wallet.update({
        where: { userId: order.buyerId },
        data: { escrow: { decrement: order.escrowAmount } },
      })
      await tx.wallet.update({
        where: { userId: order.sellerId },
        data: { balance: { increment: order.escrowAmount } },
      })
      await tx.marketplaceListing.update({ where: { id: order.listingId }, data: { status: 'SOLD' } })
    }

    // Refund escrow on cancellation (covers PENDING, CONFIRMED, IN_TRANSIT — money hasn't moved yet)
    if (status === 'CANCELLED' && ['PENDING', 'CONFIRMED', 'IN_TRANSIT'].includes(order.status)) {
      await tx.wallet.update({
        where: { userId: order.buyerId },
        data: { balance: { increment: order.escrowAmount }, escrow: { decrement: order.escrowAmount } },
      })
      await tx.marketplaceListing.update({ where: { id: order.listingId }, data: { status: 'ACTIVE' } })
    }

    return updated
  })
}
