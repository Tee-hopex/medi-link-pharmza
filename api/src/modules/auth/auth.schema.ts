import { z } from 'zod'

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional(),
    role: z.enum(['MEDICAL', 'NON_MEDICAL', 'PATIENT']),
    profession: z.string().optional(),
    specialty: z.string().optional(),
    facilityName: z.string().optional(),
    facilityType: z
      .enum([
        'COMMUNITY_PHARMACY',
        'HOSPITAL_PHARMACY',
        'PHARMACY_CHAIN',
        'HEALTHCARE_FACILITY',
        'DISTRIBUTOR',
        'WHOLESALER',
      ])
      .optional(),
    facilityAddress: z.string().optional(),
    facilityCity: z.string().optional(),
    facilityState: z.string().optional(),
    licenseNumber: z.string().optional(),
  }),
})

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
})

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
})

export type RegisterInput = z.infer<typeof registerSchema>['body']
export type LoginInput = z.infer<typeof loginSchema>['body']
