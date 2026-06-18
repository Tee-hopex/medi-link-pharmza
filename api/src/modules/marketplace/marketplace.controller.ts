import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '../../types'
import { ok, fail } from '../../types'
import * as service from './marketplace.service'

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, category, urgentOnly, sellerId } = req.query
    const listings = await service.getListings({
      search: search as string,
      category: category as string,
      urgentOnly: urgentOnly === 'true',
      sellerId: sellerId as string,
    })
    res.json(ok(listings))
  } catch (err) { next(err) }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const listing = await service.getListing(req.params.id)
    res.json(ok(listing))
  } catch (err) {
    if (err instanceof Error && err.message === 'Listing not found') { res.status(404).json(fail(err.message)); return }
    next(err)
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const listing = await service.createListing(req.user!.id, req.body)
    res.status(201).json(ok(listing, 'Listing created'))
  } catch (err) { next(err) }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await service.deleteListing(req.user!.id, req.params.id)
    res.json(ok(null, 'Listing removed'))
  } catch (err) {
    if (err instanceof Error && err.message === 'Listing not found') { res.status(404).json(fail(err.message)); return }
    next(err)
  }
}
