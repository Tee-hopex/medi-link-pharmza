'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, MapPin, Briefcase, X, Zap } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'
import { formatRelative, cn } from '@/lib/utils'
import type { Job } from '@/types'

const JOB_TYPES = [
  { value: 'FULL_TIME', label: 'Full-time', color: 'bg-blue-100 text-blue-700' },
  { value: 'PART_TIME', label: 'Part-time', color: 'bg-purple-100 text-purple-700' },
  { value: 'LOCUM', label: 'Locum', color: 'bg-amber-100 text-amber-700' },
  { value: 'CONTRACT', label: 'Contract', color: 'bg-teal-100 text-teal-700' },
]

function PostJobModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { isSubmitting } } = useForm()
  const mutation = useMutation({
    mutationFn: (data: unknown) => api.post('/jobs', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['jobs'] }); onClose() },
  })
  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Post a Job</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3">
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Job title *</label>
            <input {...register('title', { required: true })} placeholder="Staff Pharmacist" className={inputClass} /></div>
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Facility *</label>
            <input {...register('facility', { required: true })} placeholder="Lagos Central Hospital" className={inputClass} /></div>
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Location *</label>
            <input {...register('location', { required: true })} placeholder="Lagos, Nigeria" className={inputClass} /></div>
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Type *</label>
            <select {...register('type', { required: true })} className={inputClass}>
              {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select></div>
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Salary range</label>
            <input {...register('salary')} placeholder="₦200,000 - ₦350,000/month" className={inputClass} /></div>
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
            <textarea {...register('description')} rows={3} className={inputClass} /></div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input {...register('isUrgent')} type="checkbox" className="rounded text-primary-600" /> Mark as urgent
          </label>
          <button type="submit" disabled={isSubmitting || mutation.isPending}
            className="w-full bg-primary-600 text-white font-semibold py-2.5 rounded-lg hover:bg-primary-700 disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
            {mutation.isPending && <Loader2 size={16} className="animate-spin" />} Post Job
          </button>
        </form>
      </div>
    </div>
  )
}

export default function JobsPage() {
  const [showModal, setShowModal] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs', typeFilter],
    queryFn: () => {
      const p = new URLSearchParams()
      if (typeFilter) p.set('type', typeFilter)
      return api.get(`/jobs?${p}`).then((r) => r.data.data as Job[])
    },
  })

  return (
    <div className="space-y-5 max-w-4xl">
      {showModal && <PostJobModal onClose={() => setShowModal(false)} />}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setTypeFilter('')}
            className={cn('px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors', !typeFilter ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200')}>
            All
          </button>
          {JOB_TYPES.map((t) => (
            <button key={t.value} onClick={() => setTypeFilter(t.value)}
              className={cn('px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors', typeFilter === t.value ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200')}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary-700 text-sm">
          <Plus size={16} /> Post Job
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-primary-600" /></div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const typeConfig = JOB_TYPES.find((t) => t.value === job.type)
            return (
              <div key={job.id} className={cn('bg-white rounded-2xl border p-5', job.isUrgent ? 'border-red-200' : 'border-gray-100')}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {job.isUrgent && <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full"><Zap size={10} /> Urgent</span>}
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', typeConfig?.color)}>{typeConfig?.label}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                      <span className="flex items-center gap-1"><Briefcase size={13} /> {job.facility}</span>
                      <span className="flex items-center gap-1"><MapPin size={13} /> {job.location}</span>
                    </div>
                    {job.salary && <p className="text-sm font-medium text-primary-600 mt-2">{job.salary}</p>}
                    {job.description && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{job.description}</p>}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  <p className="text-xs text-gray-400">
                    {job.poster.facility?.name || `${job.poster.firstName} ${job.poster.lastName}`} · {formatRelative(job.createdAt)}
                  </p>
                  <button className="text-xs font-semibold bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors">
                    Apply
                  </button>
                </div>
              </div>
            )
          })}
          {jobs.length === 0 && <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">No jobs posted yet</div>}
        </div>
      )}
    </div>
  )
}
