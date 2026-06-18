import type { Request, Response, NextFunction } from 'express'
import * as authService from './auth.service'
import { registerSchema, loginSchema, refreshSchema } from './auth.schema'
import { ok, fail } from '../../types'

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { body } = registerSchema.parse({ body: req.body })
    const result = await authService.register(body)
    res.status(201).json(ok(result, 'Account created successfully'))
  } catch (err) {
    if (err instanceof Error && err.message === 'Email already in use') {
      res.status(409).json(fail(err.message))
      return
    }
    next(err)
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { body } = loginSchema.parse({ body: req.body })
    const result = await authService.login(body)
    res.json(ok(result, 'Login successful'))
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Invalid')) {
      res.status(401).json(fail(err.message))
      return
    }
    next(err)
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { body } = refreshSchema.parse({ body: req.body })
    const result = await authService.refresh(body.refreshToken)
    res.json(ok(result))
  } catch (err) {
    if (err instanceof Error) {
      res.status(401).json(fail(err.message))
      return
    }
    next(err)
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { body } = refreshSchema.parse({ body: req.body })
    await authService.logout(body.refreshToken)
    res.json(ok(null, 'Logged out successfully'))
  } catch (err) {
    next(err)
  }
}
