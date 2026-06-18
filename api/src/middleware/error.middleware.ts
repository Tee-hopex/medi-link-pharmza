import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { fail } from '../types'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err)

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    })
    return
  }

  if (err instanceof Error) {
    res.status(500).json(fail(err.message))
    return
  }

  res.status(500).json(fail('Internal server error'))
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json(fail('Route not found'))
}
