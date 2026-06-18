import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '../../types'
import { ok, fail } from '../../types'
import * as service from './orders.service'
import type { OrderStatus } from '@prisma/client'

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const orders = await service.getOrders(req.user!.id, req.query.role as 'buyer' | 'seller' | 'all')
    res.json(ok(orders))
  } catch (err) { next(err) }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const order = await service.getOrder(req.user!.id, req.params.id)
    res.json(ok(order))
  } catch (err) {
    if (err instanceof Error && err.message === 'Order not found') { res.status(404).json(fail(err.message)); return }
    next(err)
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const order = await service.createOrder(req.user!.id, req.body)
    res.status(201).json(ok(order, 'Order placed successfully'))
  } catch (err) {
    if (err instanceof Error && ['Listing not available', 'Cannot purchase your own listing', 'Insufficient quantity'].includes(err.message)) {
      res.status(400).json(fail(err.message)); return
    }
    next(err)
  }
}

export async function updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status, description } = req.body
    const order = await service.updateOrderStatus(req.user!.id, req.params.id, status as OrderStatus, description)

    // Notify both buyer and seller in real time
    const io = req.app.get('io')
    if (io) {
      const payload = { orderId: order.id, status: order.status }
      io.to(`user:${order.buyerId}`).emit('order:update', payload)
      io.to(`user:${order.sellerId}`).emit('order:update', payload)
    }

    res.json(ok(order, `Order ${status.toLowerCase()}`))
  } catch (err) {
    if (err instanceof Error && ['Order not found', 'Unauthorized'].includes(err.message)) {
      res.status(err.message === 'Unauthorized' ? 403 : 404).json(fail(err.message)); return
    }
    next(err)
  }
}
