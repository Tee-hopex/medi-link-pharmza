import type { User } from '@prisma/client'
import type { Request } from 'express'

export interface AuthRequest extends Request {
  user?: Pick<User, 'id' | 'role' | 'verificationLevel'>
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message }
}

export function fail(error: string): ApiResponse {
  return { success: false, error }
}
