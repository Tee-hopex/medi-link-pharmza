'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'

const ROLES = [
  { value: 'MEDICAL', label: 'Medical Professional', desc: 'Pharmacist, Doctor, Nurse' },
  { value: 'NON_MEDICAL', label: 'Non-Medical / Business', desc: 'Wholesaler, Distributor, Admin' },
  { value: 'PATIENT', label: 'Patient', desc: 'Personal medication management' },
] as const

const PROFESSIONS = ['Pharmacist', 'Doctor', 'Nurse', 'Medical Lab Scientist', 'Pharmacy Technician', 'Other']

const FACILITY_TYPES = [
  { value: 'COMMUNITY_PHARMACY', label: 'Community Pharmacy' },
  { value: 'HOSPITAL_PHARMACY', label: 'Hospital Pharmacy' },
  { value: 'PHARMACY_CHAIN', label: 'Pharmacy Chain' },
  { value: 'HEALTHCARE_FACILITY', label: 'Healthcare Facility' },
  { value: 'DISTRIBUTOR', label: 'Distributor' },
  { value: 'WHOLESALER', label: 'Wholesaler' },
]

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'At least 8 characters'),
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  role: z.enum(['MEDICAL', 'NON_MEDICAL', 'PATIENT']),
  profession: z.string().optional(),
  facilityName: z.string().optional(),
  facilityType: z.string().optional(),
  facilityAddress: z.string().optional(),
  facilityCity: z.string().optional(),
  facilityState: z.string().optional(),
  licenseNumber: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const { register: registerUser } = useAuthStore()
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'MEDICAL' },
  })

  const role = watch('role')

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await registerUser(data)
      router.push('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg || 'Registration failed. Please try again.')
    }
  }

  const inputClass = 'w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="text-gray-500 text-sm">Step {step} of 3</p>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1.5 w-8 rounded-full transition-colors ${s <= step ? 'bg-primary-600' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                <input {...register('firstName')} placeholder="Ada" className={inputClass} />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                <input {...register('lastName')} placeholder="Okafor" className={inputClass} />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input {...register('email')} type="email" placeholder="you@pharmacy.com" className={inputClass} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input {...register('password')} type="password" placeholder="Min. 8 characters" className={inputClass} />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
              <div className="space-y-2">
                {ROLES.map((r) => (
                  <label key={r.value} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${role === r.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" {...register('role')} value={r.value} className="mt-0.5 text-primary-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{r.label}</div>
                      <div className="text-xs text-gray-500">{r.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <button type="button" onClick={() => setStep(2)} className="w-full bg-primary-600 text-white font-semibold py-2.5 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 text-sm">
              Continue <ChevronRight size={16} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {role === 'MEDICAL' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                <select {...register('profession')} className={inputClass}>
                  <option value="">Select profession</option>
                  {PROFESSIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}
            {role !== 'PATIENT' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facility name</label>
                  <input {...register('facilityName')} placeholder="Lagos Central Pharmacy" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facility type</label>
                  <select {...register('facilityType')} className={inputClass}>
                    <option value="">Select type</option>
                    {FACILITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input {...register('facilityAddress')} placeholder="12 Broad Street" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input {...register('facilityCity')} placeholder="Lagos" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input {...register('facilityState')} placeholder="Lagos" className={inputClass} />
                  </div>
                </div>
              </>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm">
                <ChevronLeft size={16} /> Back
              </button>
              <button type="button" onClick={() => setStep(3)} className="flex-1 bg-primary-600 text-white font-semibold py-2.5 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 text-sm">
                Continue <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-primary-50 rounded-xl p-4 text-sm text-primary-800">
              <div className="font-medium mb-1">License Verification</div>
              <p>Enter your license number for verification. Your account will show as PENDING until verified by our team.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License / Registration Number</label>
              <input {...register('licenseNumber')} placeholder="PCN/2024/XXXXX" className={inputClass} />
              <p className="text-xs text-gray-400 mt-1">Optional — you can add this later in Settings</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm">
                <ChevronLeft size={16} /> Back
              </button>
              <button type="submit" disabled={isSubmitting} className="flex-1 bg-primary-600 text-white font-semibold py-2.5 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? 'Creating...' : 'Create account'}
              </button>
            </div>
          </div>
        )}
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
      </p>
    </>
  )
}
