import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '../../types'
import { ok, fail } from '../../types'
import * as service from './inventory.service'

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, category, expiringInDays, deadStockOnly } = req.query
    const items = await service.getInventory(req.user!.id, {
      search: search as string,
      category: category as string,
      expiringInDays: expiringInDays ? parseInt(expiringInDays as string) : undefined,
      deadStockOnly: deadStockOnly === 'true',
    })
    res.json(ok(items))
  } catch (err) { next(err) }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const item = await service.getItem(req.user!.id, req.params.id)
    res.json(ok(item))
  } catch (err) {
    if (err instanceof Error && err.message === 'Item not found') { res.status(404).json(fail(err.message)); return }
    next(err)
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const item = await service.createItem(req.user!.id, req.body)
    res.status(201).json(ok(item, 'Item added to inventory'))
  } catch (err) { next(err) }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const item = await service.updateItem(req.user!.id, req.params.id, req.body)
    res.json(ok(item, 'Item updated'))
  } catch (err) {
    if (err instanceof Error && err.message === 'Item not found') { res.status(404).json(fail(err.message)); return }
    next(err)
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await service.deleteItem(req.user!.id, req.params.id)
    res.json(ok(null, 'Item deleted'))
  } catch (err) {
    if (err instanceof Error && err.message === 'Item not found') { res.status(404).json(fail(err.message)); return }
    next(err)
  }
}

export async function expiryAlerts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const alerts = await service.getExpiryAlerts(req.user!.id)
    res.json(ok(alerts))
  } catch (err) { next(err) }
}

export async function deadStock(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const items = await service.detectDeadStock(req.user!.id)
    res.json(ok(items))
  } catch (err) { next(err) }
}
