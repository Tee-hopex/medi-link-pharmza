'use client'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2, User, Building2, Lock, Bell } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'

const inputClass = 'w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'

function ProfileSection() {
  const { user, refreshUser } = useAuthStore()
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: { firstName: user?.firstName, lastName: user?.lastName, profession: user?.profession, specialty: user?.specialty } })
  const mutation = useMutation({
    mutationFn: (data: unknown) => api.patch('/users/me', data),
    onSuccess: () => refreshUser(),
  })
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <User size={18} className="text-primary-600" />
        <h2 className="font-semibold text-gray-900">Personal Information</h2>
      </div>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">First name</label>
            <input {...register('firstName')} className={inputClass} /></div>
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Last name</label>
            <input {...register('lastName')} className={inputClass} /></div>
        </div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
          <input value={user?.email} disabled className={`${inputClass} bg-gray-50 text-gray-400`} /></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Profession</label>
          <input {...register('profession')} className={inputClass} /></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Specialty</label>
          <input {...register('specialty')} className={inputClass} /></div>
        {mutation.isSuccess && <p className="text-sm text-green-600">Profile updated successfully</p>}
        <button type="submit" disabled={isSubmitting || mutation.isPending}
          className="bg-primary-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2 text-sm">
          {mutation.isPending && <Loader2 size={14} className="animate-spin" />} Save changes
        </button>
      </form>
    </div>
  )
}

function FacilitySection() {
  const { user } = useAuthStore()
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { name: user?.facility?.name, address: '', city: user?.facility?.city, state: user?.facility?.state }
  })
  const mutation = useMutation({ mutationFn: (data: unknown) => api.patch('/users/me/facility', data) })
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Building2 size={18} className="text-primary-600" />
        <h2 className="font-semibold text-gray-900">Facility Details</h2>
        {user?.facility?.verified && <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">Verified</span>}
      </div>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Facility name</label>
          <input {...register('name')} className={inputClass} /></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Address</label>
          <input {...register('address')} className={inputClass} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">City</label>
            <input {...register('city')} className={inputClass} /></div>
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">State</label>
            <input {...register('state')} className={inputClass} /></div>
        </div>
        {mutation.isSuccess && <p className="text-sm text-green-600">Facility updated</p>}
        <button type="submit" disabled={isSubmitting || mutation.isPending}
          className="bg-primary-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2 text-sm">
          {mutation.isPending && <Loader2 size={14} className="animate-spin" />} Save changes
        </button>
      </form>
    </div>
  )
}

function PasswordSection() {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{ currentPassword: string; newPassword: string }>()
  const [error, setError] = useState('')
  const mutation = useMutation({
    mutationFn: (data: unknown) => api.patch('/users/me/password', data),
    onSuccess: () => reset(),
    onError: (err: unknown) => setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed'),
  })
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Lock size={18} className="text-primary-600" />
        <h2 className="font-semibold text-gray-900">Change Password</h2>
      </div>
      <form onSubmit={handleSubmit((d) => { setError(''); mutation.mutate(d) })} className="space-y-4">
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">Current password</label>
          <input {...register('currentPassword', { required: true })} type="password" className={inputClass} /></div>
        <div><label className="text-xs font-medium text-gray-600 mb-1 block">New password</label>
          <input {...register('newPassword', { required: true, minLength: 8 })} type="password" className={inputClass} /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {mutation.isSuccess && <p className="text-sm text-green-600">Password updated</p>}
        <button type="submit" disabled={isSubmitting || mutation.isPending}
          className="bg-primary-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2 text-sm">
          {mutation.isPending && <Loader2 size={14} className="animate-spin" />} Update password
        </button>
      </form>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <ProfileSection />
      <FacilitySection />
      <PasswordSection />
    </div>
  )
}
